import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { toast } from '@/hooks/use-toast';
import {
  cacheVocabularyGroups,
  getCachedVocabularyGroups,
  getCachedVocabulary,
  cacheVocabulary,
  addPendingAction,
  getPendingActions,
  removePendingAction,
  setSyncStatus,
} from '@/lib/offlineCache';

export interface VocabularyGroup {
  id: string;
  name: string;
  created_at: string;
  word_count?: number;
}

function computeCounts(groupsData: any[], vocab: any[]): VocabularyGroup[] {
  const counts = new Map<string, number>();
  (vocab || []).forEach((row: any) => {
    if (row.group_id) counts.set(row.group_id, (counts.get(row.group_id) || 0) + 1);
  });
  return (groupsData || []).map(g => ({ ...g, word_count: counts.get(g.id) || 0 }));
}

export function useVocabularyGroups() {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const cachedGroupsInit = getCachedVocabularyGroups();
  const cachedVocabInit = getCachedVocabulary();
  const [groups, setGroups] = useState<VocabularyGroup[]>(
    cachedGroupsInit ? computeCounts(cachedGroupsInit, cachedVocabInit || []) : []
  );
  const [isLoading, setIsLoading] = useState(cachedGroupsInit ? false : true);
  const hasSyncedPending = useRef(false);

  const syncPendingActions = useCallback(async () => {
    if (!user || !isOnline || hasSyncedPending.current) return;
    const pending = getPendingActions().filter(a => a.table === 'vocabulary_groups');
    if (pending.length === 0) return;
    hasSyncedPending.current = true;
    setSyncStatus('syncing');
    for (const action of pending) {
      try {
        if (action.type === 'add') {
          await supabase.from('vocabulary_groups').insert(action.data);
        } else if (action.type === 'update') {
          await supabase.from('vocabulary_groups').update(action.data.updates).eq('id', action.data.id);
        } else if (action.type === 'delete') {
          await supabase.from('vocabulary_groups').delete().eq('id', action.data.id);
        }
        removePendingAction(action.id);
      } catch (err) {
        console.error('Error syncing group action:', err);
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

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
      setIsLoading(false);
      return;
    }
    if (!isOnline) {
      const cg = getCachedVocabularyGroups();
      const cv = getCachedVocabulary();
      if (cg) setGroups(computeCounts(cg, cv || []));
      setIsLoading(false);
      return;
    }
    const { data: groupsData } = await supabase
      .from('vocabulary_groups')
      .select('id, name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const { data: vocabData } = await supabase
      .from('vocabulary')
      .select('group_id')
      .eq('user_id', user.id)
      .not('group_id', 'is', null);

    cacheVocabularyGroups(groupsData || []);
    setGroups(computeCounts(groupsData || [], vocabData || []));
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => { fetchGroups(); }, [fetchGroups]);

  useEffect(() => {
    if (!user || !isOnline) return;
    const channel = supabase
      .channel('vocab-groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary_groups', filter: `user_id=eq.${user.id}` }, fetchGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary', filter: `user_id=eq.${user.id}` }, fetchGroups)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchGroups, isOnline]);

  const createGroup = async (name: string) => {
    if (!user || !name.trim()) return;
    const optimisticId = crypto.randomUUID();
    const optimistic: VocabularyGroup = {
      id: optimisticId,
      name: name.trim(),
      created_at: new Date().toISOString(),
      word_count: 0,
    };
    setGroups(prev => {
      const next = [optimistic, ...prev];
      cacheVocabularyGroups(next);
      return next;
    });
    const payload = { id: optimisticId, user_id: user.id, name: name.trim() };
    if (!isOnline) {
      addPendingAction({ type: 'add', table: 'vocabulary_groups', data: payload });
      toast({ title: 'Group created (offline)' });
      return;
    }
    const { error } = await supabase.from('vocabulary_groups').insert(payload);
    if (error) {
      setGroups(prev => prev.filter(g => g.id !== optimisticId));
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Group created' });
  };

  const renameGroup = async (id: string, name: string) => {
    if (!user || !name.trim()) return;
    setGroups(prev => {
      const next = prev.map(g => g.id === id ? { ...g, name: name.trim() } : g);
      cacheVocabularyGroups(next);
      return next;
    });
    if (!isOnline) {
      addPendingAction({ type: 'update', table: 'vocabulary_groups', data: { id, updates: { name: name.trim() } } });
      toast({ title: 'Group renamed (offline)' });
      return;
    }
    const { error } = await supabase
      .from('vocabulary_groups')
      .update({ name: name.trim() })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); fetchGroups(); return; }
    toast({ title: 'Group renamed' });
  };

  const deleteGroup = async (id: string) => {
    if (!user) return;
    setGroups(prev => {
      const next = prev.filter(g => g.id !== id);
      cacheVocabularyGroups(next);
      return next;
    });
    // Also detach words locally
    const cv = getCachedVocabulary();
    if (cv) {
      const updated = cv.map((w: any) => w.group_id === id ? { ...w, group_id: null } : w);
      cacheVocabulary(updated);
    }
    if (!isOnline) {
      addPendingAction({ type: 'delete', table: 'vocabulary_groups', data: { id } });
      toast({ title: 'Group deleted (offline)' });
      return;
    }
    const { error } = await supabase.from('vocabulary_groups').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); fetchGroups(); return; }
    toast({ title: 'Group deleted — words returned to general vocabulary' });
  };

  const moveWordToGroup = async (wordId: string, groupId: string | null) => {
    if (!user) return;
    // Optimistic local cache update
    const cv = getCachedVocabulary();
    if (cv) {
      const updated = cv.map((w: any) => w.id === wordId ? { ...w, group_id: groupId } : w);
      cacheVocabulary(updated);
    }
    setGroups(prev => {
      const cv2 = getCachedVocabulary() || [];
      return computeCounts(prev, cv2);
    });
    if (!isOnline) {
      addPendingAction({ type: 'update', table: 'vocabulary', data: { id: wordId, updates: { group_id: groupId } } });
      toast({ title: groupId ? 'Word added to group (offline)' : 'Word returned to general vocabulary (offline)' });
      return;
    }
    const { error } = await supabase.from('vocabulary').update({ group_id: groupId }).eq('id', wordId).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: groupId ? 'Word added to group' : 'Word returned to general vocabulary' });
  };

  const setWordDifficult = async (wordId: string, isDifficult: boolean) => {
    if (!user) return;
    const cv = getCachedVocabulary();
    if (cv) {
      const updated = cv.map((w: any) => w.id === wordId ? { ...w, is_difficult: isDifficult } : w);
      cacheVocabulary(updated);
    }
    if (!isOnline) {
      addPendingAction({ type: 'update', table: 'vocabulary', data: { id: wordId, updates: { is_difficult: isDifficult } } });
      toast({ title: isDifficult ? 'Marked as difficult (offline)' : 'Removed from difficult (offline)' });
      return;
    }
    const { error } = await supabase.from('vocabulary').update({ is_difficult: isDifficult }).eq('id', wordId).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: isDifficult ? 'Marked as difficult' : 'Removed from difficult' });
  };

  return { groups, isLoading, createGroup, renameGroup, deleteGroup, moveWordToGroup, setWordDifficult, refetch: fetchGroups };
}
