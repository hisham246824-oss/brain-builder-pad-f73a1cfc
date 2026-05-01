import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface VocabularyGroup {
  id: string;
  name: string;
  created_at: string;
  word_count?: number;
}

export function useVocabularyGroups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<VocabularyGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([]);
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

    const counts = new Map<string, number>();
    (vocabData || []).forEach((row: any) => {
      if (row.group_id) counts.set(row.group_id, (counts.get(row.group_id) || 0) + 1);
    });

    setGroups((groupsData || []).map(g => ({ ...g, word_count: counts.get(g.id) || 0 })));
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('vocab-groups-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary_groups', filter: `user_id=eq.${user.id}` }, fetchGroups)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary', filter: `user_id=eq.${user.id}` }, fetchGroups)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchGroups]);

  const createGroup = async (name: string) => {
    if (!user || !name.trim()) return;
    const { error } = await supabase.from('vocabulary_groups').insert({ user_id: user.id, name: name.trim() });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Group created' });
    fetchGroups();
  };

  const deleteGroup = async (id: string) => {
    if (!user) return;
    // ON DELETE SET NULL — words automatically return to general vocab
    const { error } = await supabase.from('vocabulary_groups').delete().eq('id', id).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Group deleted — words returned to general vocabulary' });
    fetchGroups();
  };

  const moveWordToGroup = async (wordId: string, groupId: string | null) => {
    if (!user) return;
    const { error } = await supabase.from('vocabulary').update({ group_id: groupId }).eq('id', wordId).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: groupId ? 'Word added to group' : 'Word returned to general vocabulary' });
  };

  const setWordDifficult = async (wordId: string, isDifficult: boolean) => {
    if (!user) return;
    const { error } = await supabase.from('vocabulary').update({ is_difficult: isDifficult }).eq('id', wordId).eq('user_id', user.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: isDifficult ? 'Marked as difficult' : 'Removed from difficult' });
  };

  return { groups, isLoading, createGroup, deleteGroup, moveWordToGroup, setWordDifficult, refetch: fetchGroups };
}
