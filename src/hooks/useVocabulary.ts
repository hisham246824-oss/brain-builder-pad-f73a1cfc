import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cacheVocabulary, getCachedVocabulary, addPendingAction, getPendingActions, removePendingAction, setSyncStatus } from '@/lib/offlineCache';

export interface VocabularyWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  created_at: string;
  group_id?: string | null;
  is_difficult?: boolean;
}

export type VocabularyView =
  | { type: 'main' }
  | { type: 'group'; groupId: string }
  | { type: 'all' };

export type AddWordResult =
  | { data: VocabularyWord; duplicate?: false }
  | { duplicate: true; existing: VocabularyWord }
  | { error: Error };

export function useVocabulary(view: VocabularyView = { type: 'all' }) {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const cachedInit = !navigator.onLine ? getCachedVocabulary() : null;
  const [words, setWords] = useState<VocabularyWord[]>(cachedInit || []);
  const [isLoading, setIsLoading] = useState(cachedInit ? false : true);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const isLocalChange = useRef(false);
  const hasSyncedPending = useRef(false);
  const hasLoadedOnce = useRef(cachedInit ? true : false);

  useEffect(() => {
    const handleCacheUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ key?: string }>;
      if (customEvent.detail?.key !== 'offline_vocabulary_cache') return;
      const cached = getCachedVocabulary();
      if (cached) setWords(cached);
    };

    window.addEventListener('offline-cache-update', handleCacheUpdate as EventListener);
    return () => window.removeEventListener('offline-cache-update', handleCacheUpdate as EventListener);
  }, []);

  // Sync pending vocabulary actions when coming back online.
  // We pass the optimistic id along so the DB row uses the same id (no duplicate).
  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;

    const pendingActions = getPendingActions();
    const vocabActions = pendingActions.filter(a => a.table === 'vocabulary');
    if (vocabActions.length === 0) return;

    hasSyncedPending.current = true;
    setSyncStatus('syncing');

    for (const action of vocabActions) {
      try {
        if (action.type === 'add') {
          // Insert with the same optimistic id we already showed locally,
          // so realtime + refetch merge cleanly without producing a duplicate row.
          await supabase.from('vocabulary').insert(action.data);
        } else if (action.type === 'update') {
          await supabase.from('vocabulary').update(action.data.updates).eq('id', action.data.id);
        } else if (action.type === 'delete') {
          await supabase.from('vocabulary').delete().eq('id', action.data.id);
        }
        removePendingAction(action.id);
      } catch (error) {
        console.error('Error syncing vocabulary action:', error);
      }
    }

    setSyncStatus('synced');
  }, [user, isOnline]);

  useEffect(() => {
    if (isOnline) {
      hasSyncedPending.current = false;
      syncPendingActions();
    }
  }, [isOnline, syncPendingActions]);

  const fetchWords = useCallback(async () => {
    if (!user) {
      setWords([]);
      setIsLoading(false);
      return;
    }

    if (!isOnline) {
      const cached = getCachedVocabulary();
      if (cached) setWords(cached);
      setIsLoading(false);
      return;
    }

    if (!hasLoadedOnce.current) setIsLoading(true);
    const { data, error } = await supabase
      .from('vocabulary')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching vocabulary:', error);
      const cached = getCachedVocabulary();
      if (cached) setWords(cached);
    } else {
      setWords(data || []);
      cacheVocabulary(data || []);
      hasLoadedOnce.current = true;
    }
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => { fetchWords(); }, [fetchWords]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline && user) {
        fetchWords();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchWords, isOnline, user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('vocabulary-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vocabulary', filter: `user_id=eq.${user.id}` },
        () => {
          if (isLocalChange.current) { isLocalChange.current = false; return; }
          fetchWords();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchWords]);

  const addWord = useCallback(async (
    word: string,
    meanings: string,
    notes?: string,
    groupId?: string | null,
  ): Promise<AddWordResult> => {
    if (!user) return { error: new Error('Not authenticated') };

    const trimmed = word.trim();
    // Case-insensitive duplicate check across ALL of user's words (any group).
    const existing = words.find(w => w.word.trim().toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      return { duplicate: true, existing };
    }

    const optimisticId = crypto.randomUUID();
    const optimisticWord: VocabularyWord = {
      id: optimisticId,
      word: trimmed,
      meanings: meanings.trim(),
      notes: notes?.trim() || null,
      created_at: new Date().toISOString(),
      group_id: groupId ?? null,
      is_difficult: false,
    };

    setWords(prev => {
      const updated = [optimisticWord, ...prev];
      cacheVocabulary(updated);
      return updated;
    });

    const payload = {
      id: optimisticId, // ← keep ids stable to avoid duplicates after sync
      user_id: user.id,
      word: trimmed,
      meanings: meanings.trim(),
      notes: notes?.trim() || null,
      group_id: groupId ?? null,
    };

    if (!isOnline) {
      addPendingAction({ type: 'add', table: 'vocabulary', data: payload });
      return { data: optimisticWord };
    }

    isLocalChange.current = true;
    const { data, error } = await supabase
      .from('vocabulary')
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error('Error adding word:', error);
      setWords(prev => prev.filter(w => w.id !== optimisticId));
      return { error };
    }

    setWords(prev => {
      const updated = prev.map(w => w.id === optimisticId ? data : w);
      cacheVocabulary(updated);
      return updated;
    });
    return { data };
  }, [user, isOnline, words]);

  const deleteWord = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    setWords(prev => {
      const updated = prev.filter(w => w.id !== id);
      cacheVocabulary(updated);
      return updated;
    });

    if (!isOnline) {
      addPendingAction({ type: 'delete', table: 'vocabulary', data: { id } });
      return { error: null };
    }

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting word:', error);
      fetchWords();
      return { error };
    }

    return { error: null };
  }, [user, isOnline, fetchWords]);

  const filteredWords = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();

    return words.filter((word) => {
      if (view.type === 'main' && word.group_id) return false;
      if (view.type === 'group' && word.group_id !== view.groupId) return false;
      if (!normalizedQuery) return true;

      return (
        word.word.toLowerCase().includes(normalizedQuery) ||
        word.meanings.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [words, view, deferredSearchQuery]);

  return {
    words: filteredWords,
    allWords: words,
    isLoading,
    searchQuery,
    setSearchQuery,
    addWord,
    deleteWord,
    refetch: fetchWords,
  };
}
