import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cacheVocabulary, getCachedVocabulary, addPendingAction, getPendingActions, removePendingAction } from '@/lib/offlineCache';

export interface VocabularyWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  created_at: string;
}

export function useVocabulary() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const isLocalChange = useRef(false);
  const hasSyncedPending = useRef(false);
  const hasLoadedOnce = useRef(false);

  // Sync pending vocabulary actions when coming back online
  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;
    
    const pendingActions = getPendingActions();
    const vocabActions = pendingActions.filter(a => a.table === 'vocabulary');
    if (vocabActions.length === 0) return;
    
    hasSyncedPending.current = true;
    
    for (const action of vocabActions) {
      try {
        if (action.type === 'add') {
          await supabase.from('vocabulary').insert(action.data);
        } else if (action.type === 'delete') {
          await supabase.from('vocabulary').delete().eq('id', action.data.id);
        }
        removePendingAction(action.id);
      } catch (error) {
        console.error('Error syncing vocabulary action:', error);
      }
    }
    
    // Silent sync - no toast notification
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

    // If offline, use cached data
    if (!isOnline) {
      const cached = getCachedVocabulary();
      if (cached) {
        setWords(cached);
      }
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
      // Fallback to cache on error
      const cached = getCachedVocabulary();
      if (cached) {
        setWords(cached);
      }
    } else {
      setWords(data || []);
      cacheVocabulary(data || []);
      hasLoadedOnce.current = true;
    }
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  // Background refetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline && user) {
        fetchWords();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchWords, isOnline, user]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('vocabulary-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vocabulary',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          if (isLocalChange.current) {
            isLocalChange.current = false;
            return;
          }
          // Silent sync - no toast notification
          fetchWords();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWords]);

  const addWord = useCallback(async (word: string, meanings: string, notes?: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('vocabulary')
      .insert({
        user_id: user.id,
        word: word.trim(),
        meanings: meanings.trim(),
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding word:', error);
      return { error };
    }

    // Optimistically update the local state immediately
    setWords(prev => [data, ...prev]);
    return { data };
  }, [user]);

  const deleteWord = useCallback(async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Optimistically update
    setWords(prev => prev.filter(w => w.id !== id));

    const { error } = await supabase
      .from('vocabulary')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting word:', error);
      fetchWords(); // Revert on error
      return { error };
    }

    return { error: null };
  }, [user, fetchWords]);

  const filteredWords = words.filter(word => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      word.word.toLowerCase().includes(query) ||
      word.meanings.toLowerCase().includes(query)
    );
  });

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
