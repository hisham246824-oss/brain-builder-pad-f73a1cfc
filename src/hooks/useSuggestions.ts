import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  votes_count: number;
  user_display_name: string | null;
  user_avatar_color: string | null;
  user_avatar_icon: string | null;
  has_voted: boolean;
}

export function useSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasLoadedOnce = useRef(false);

  const fetchSuggestions = useCallback(async (silent = false) => {
    if (!silent && !hasLoadedOnce.current) setIsLoading(true);
    try {
      const { data: suggestionsData, error } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get votes
      const { data: votesData } = await supabase
        .from('suggestion_votes')
        .select('suggestion_id, user_id');

      // Get user settings for display names and avatars
      const userIds = [...new Set(suggestionsData?.map(s => s.user_id) || [])];
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('user_id, display_name, avatar_color, avatar_icon')
        .in('user_id', userIds);

      // Count votes per suggestion
      const votesCounts: Record<string, number> = {};
      const userVotes = new Set<string>();
      votesData?.forEach(vote => {
        votesCounts[vote.suggestion_id] = (votesCounts[vote.suggestion_id] || 0) + 1;
        if (user && vote.user_id === user.id) {
          userVotes.add(vote.suggestion_id);
        }
      });

      const enriched: Suggestion[] = (suggestionsData || []).map(s => {
        const settings = userSettings?.find(u => u.user_id === s.user_id);
        return {
          ...s,
          votes_count: votesCounts[s.id] || 0,
          user_display_name: settings?.display_name || null,
          user_avatar_color: settings?.avatar_color || null,
          user_avatar_icon: settings?.avatar_icon || null,
          has_voted: userVotes.has(s.id),
        };
      });

      // Sort by votes (most voted first)
      enriched.sort((a, b) => b.votes_count - a.votes_count);
      setSuggestions(enriched);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    } finally {
      if (!hasLoadedOnce.current) setIsLoading(false);
      else setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  // Realtime subscription for cross-device sync
  useEffect(() => {
    const channel = supabase
      .channel('suggestions-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => {
        fetchSuggestions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestion_votes' }, () => {
        fetchSuggestions();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchSuggestions]);

  // Background refetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchSuggestions();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [fetchSuggestions]);

  const addSuggestion = useCallback(async (title: string, description: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          title,
          description,
        });

      if (error) throw error;
      toast.success('Suggestion submitted successfully!');
      fetchSuggestions();
      return true;
    } catch (err) {
      console.error('Error adding suggestion:', err);
      toast.error('Failed to submit suggestion');
      return false;
    }
  }, [user, fetchSuggestions]);

  const toggleVote = useCallback(async (suggestionId: string) => {
    if (!user) return;

    const suggestion = suggestions.find(s => s.id === suggestionId);
    if (!suggestion) return;

    // Optimistic update
    setSuggestions(prev => prev.map(s => {
      if (s.id !== suggestionId) return s;
      const newHasVoted = !s.has_voted;
      return {
        ...s,
        has_voted: newHasVoted,
        votes_count: newHasVoted ? s.votes_count + 1 : s.votes_count - 1,
      };
    }).sort((a, b) => b.votes_count - a.votes_count));

    try {
      if (suggestion.has_voted) {
        // Remove vote
        const { error } = await supabase
          .from('suggestion_votes')
          .delete()
          .eq('suggestion_id', suggestionId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from('suggestion_votes')
          .insert({
            suggestion_id: suggestionId,
            user_id: user.id,
          });
        if (error) throw error;
        toast.success('Thank you for contributing to the site\'s development! 🎉');
      }
    } catch (err) {
      console.error('Error toggling vote:', err);
      fetchSuggestions(); // Revert on error
    }
  }, [user, suggestions, fetchSuggestions]);

  return {
    suggestions,
    isLoading,
    addSuggestion,
    toggleVote,
    refetch: fetchSuggestions,
  };
}
