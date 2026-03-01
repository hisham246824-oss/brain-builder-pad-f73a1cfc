import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from './useUserRole';
import { toast } from 'sonner';

interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface AdminStats {
  totalUsers: number;
  activeToday: number;
  totalMaterials: number;
  totalLessons: number;
  totalVocabulary: number;
  totalSuggestions: number;
  totalMessages: number;
  totalPolls: number;
  mostVisitedPages: { page: string; visits: number }[];
  longestDurationPages: { page: string; duration: number }[];
  recentActivity: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
}

interface AdminMessage {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  sender_id: string | null;
}

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  votes_count: number;
  user_display_name: string | null;
  user_email: string | null;
}

interface UserActivity {
  materials_count: number;
  lessons_count: number;
  vocabulary_count: number;
  suggestions_count: number;
  total_visits: number;
  total_duration: number;
  last_active: string | null;
  most_visited_page: string | null;
}

interface AdminPoll {
  id: string;
  sender_id: string | null;
  question: string;
  options: string[];
  created_at: string;
  is_active: boolean;
  votes: { option_index: number; count: number }[];
  total_votes: number;
}

export function useAdminData() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useUserRole();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase.from('user_roles').select('*');
      if (rolesError) throw rolesError;

      const { data: settings } = await supabase.from('user_settings').select('user_id, display_name, avatar_color, avatar_icon');

      const usersWithRoles: UserWithProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const userSetting = settings?.find(s => s.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: '',
          created_at: profile.created_at,
          last_sign_in_at: null,
          display_name: userSetting?.display_name || profile.display_name,
          avatar_url: profile.avatar_url,
          role: userRole?.role || 'user',
        };
      });
      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [isAdmin]);

  const fetchUserActivity = useCallback(async (userId: string): Promise<UserActivity> => {
    const [materials, lessons, vocabulary, suggestions, visits] = await Promise.all([
      supabase.from('study_materials').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('vocabulary').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('page_visits').select('page_path, duration_seconds, visited_at').eq('user_id', userId).order('visited_at', { ascending: false }),
    ]);

    const pageStats: Record<string, number> = {};
    let totalDuration = 0;
    visits.data?.forEach(v => {
      pageStats[v.page_path] = (pageStats[v.page_path] || 0) + 1;
      totalDuration += v.duration_seconds || 0;
    });

    const mostVisited = Object.entries(pageStats).sort((a, b) => b[1] - a[1])[0];

    return {
      materials_count: materials.count || 0,
      lessons_count: lessons.count || 0,
      vocabulary_count: vocabulary.count || 0,
      suggestions_count: suggestions.count || 0,
      total_visits: visits.data?.length || 0,
      total_duration: totalDuration,
      last_active: visits.data?.[0]?.visited_at || null,
      most_visited_page: mostVisited?.[0] || null,
    };
  }, []);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [totalUsers, activeToday, totalMaterials, totalLessons, totalVocabulary, totalSuggestions, totalMessages, totalPolls, pageVisits, userProfiles] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('user_activity').select('*', { count: 'exact', head: true }).eq('activity_date', new Date().toISOString().split('T')[0]),
        supabase.from('study_materials').select('*', { count: 'exact', head: true }),
        supabase.from('lessons').select('*', { count: 'exact', head: true }),
        supabase.from('vocabulary').select('*', { count: 'exact', head: true }),
        supabase.from('suggestions').select('*', { count: 'exact', head: true }),
        supabase.from('admin_messages').select('*', { count: 'exact', head: true }),
        supabase.from('admin_polls').select('*', { count: 'exact', head: true }),
        supabase.from('page_visits').select('page_path, duration_seconds'),
        supabase.from('profiles').select('created_at').order('created_at', { ascending: true }),
      ]);

      const pageStatsMap: Record<string, { visits: number; duration: number }> = {};
      pageVisits.data?.forEach(visit => {
        if (!pageStatsMap[visit.page_path]) pageStatsMap[visit.page_path] = { visits: 0, duration: 0 };
        pageStatsMap[visit.page_path].visits++;
        pageStatsMap[visit.page_path].duration += visit.duration_seconds || 0;
      });

      const mostVisitedPages = Object.entries(pageStatsMap)
        .map(([page, data]) => ({ page, visits: data.visits }))
        .sort((a, b) => b.visits - a.visits).slice(0, 5);

      const longestDurationPages = Object.entries(pageStatsMap)
        .map(([page, data]) => ({ page, duration: data.duration }))
        .sort((a, b) => b.duration - a.duration).slice(0, 5);

      // User growth by month
      const growthMap: Record<string, number> = {};
      userProfiles.data?.forEach(p => {
        const month = p.created_at.substring(0, 7);
        growthMap[month] = (growthMap[month] || 0) + 1;
      });
      const userGrowth = Object.entries(growthMap).map(([date, count]) => ({ date, count }));

      setStats({
        totalUsers: totalUsers.count || 0,
        activeToday: activeToday.count || 0,
        totalMaterials: totalMaterials.count || 0,
        totalLessons: totalLessons.count || 0,
        totalVocabulary: totalVocabulary.count || 0,
        totalSuggestions: totalSuggestions.count || 0,
        totalMessages: totalMessages.count || 0,
        totalPolls: totalPolls.count || 0,
        mostVisitedPages,
        longestDurationPages,
        recentActivity: [],
        userGrowth,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [isAdmin]);

  const fetchMessages = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data, error } = await supabase.from('admin_messages').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [isAdmin]);

  const fetchSuggestions = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data: suggestionsData, error } = await supabase.from('suggestions').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const [votesResult, profilesResult] = await Promise.all([
        supabase.from('suggestion_votes').select('suggestion_id'),
        supabase.from('profiles').select('user_id, display_name'),
      ]);

      const votesCounts: Record<string, number> = {};
      votesResult.data?.forEach(v => { votesCounts[v.suggestion_id] = (votesCounts[v.suggestion_id] || 0) + 1; });

      const suggestionsWithData: Suggestion[] = (suggestionsData || []).map(s => ({
        ...s,
        votes_count: votesCounts[s.id] || 0,
        user_display_name: profilesResult.data?.find(p => p.user_id === s.user_id)?.display_name || null,
        user_email: null,
      }));
      suggestionsWithData.sort((a, b) => b.votes_count - a.votes_count);
      setSuggestions(suggestionsWithData);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  }, [isAdmin]);

  const fetchPolls = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const { data: pollsData, error } = await supabase.from('admin_polls').select('*').order('created_at', { ascending: false });
      if (error) throw error;

      const { data: votesData } = await supabase.from('poll_votes').select('poll_id, option_index');

      const pollsWithVotes: AdminPoll[] = (pollsData || []).map(poll => {
        const pollVotes = votesData?.filter(v => v.poll_id === poll.id) || [];
        const voteCounts: Record<number, number> = {};
        pollVotes.forEach(v => { voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1; });
        const options = Array.isArray(poll.options) ? poll.options as string[] : [];
        return {
          ...poll,
          options,
          votes: Object.entries(voteCounts).map(([idx, count]) => ({ option_index: Number(idx), count })),
          total_votes: pollVotes.length,
        };
      });
      setPolls(pollsWithVotes);
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
  }, [isAdmin]);

  // Message CRUD
  const sendBroadcastMessage = async (title: string, content: string) => {
    if (!isAdmin || !user) return false;
    try {
      const { error } = await supabase.from('admin_messages').insert({ sender_id: user.id, title, content });
      if (error) throw error;
      toast.success('Message sent successfully');
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  };

  const updateMessage = async (messageId: string, title: string, content: string) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from('admin_messages').update({ title, content }).eq('id', messageId);
      if (error) throw error;
      toast.success('Message updated');
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Error updating message:', err);
      toast.error('Failed to update message');
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from('admin_messages').delete().eq('id', messageId);
      if (error) throw error;
      toast.success('Message deleted');
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
      return false;
    }
  };

  // Poll CRUD
  const createPoll = async (question: string, options: string[]) => {
    if (!isAdmin || !user) return false;
    try {
      const { error } = await supabase.from('admin_polls').insert({
        sender_id: user.id,
        question,
        options: options as any,
      });
      if (error) throw error;
      toast.success('Poll created');
      fetchPolls();
      return true;
    } catch (err) {
      console.error('Error creating poll:', err);
      toast.error('Failed to create poll');
      return false;
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from('admin_polls').delete().eq('id', pollId);
      if (error) throw error;
      toast.success('Poll deleted');
      fetchPolls();
      return true;
    } catch (err) {
      console.error('Error deleting poll:', err);
      toast.error('Failed to delete poll');
      return false;
    }
  };

  const togglePollActive = async (pollId: string, isActive: boolean) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from('admin_polls').update({ is_active: isActive }).eq('id', pollId);
      if (error) throw error;
      toast.success(isActive ? 'Poll activated' : 'Poll closed');
      fetchPolls();
      return true;
    } catch (err) {
      console.error('Error toggling poll:', err);
      return false;
    }
  };

  // User management
  const deleteUser = async (userId: string) => {
    if (!isSuperAdmin) { toast.error('Only super admin can delete users'); return false; }
    try {
      await Promise.all([
        supabase.from('study_materials').delete().eq('user_id', userId),
        supabase.from('vocabulary').delete().eq('user_id', userId),
        supabase.from('user_settings').delete().eq('user_id', userId),
        supabase.from('suggestions').delete().eq('user_id', userId),
      ]);
      await supabase.from('profiles').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);
      toast.success('Account deleted successfully');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete account');
      return false;
    }
  };

  const promoteToAdmin = async (userId: string, password: string) => {
    if (!isSuperAdmin) { toast.error('Only super admin can promote users'); return false; }
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password });
      if (signInError) { toast.error('Incorrect password'); return false; }
      const { error } = await supabase.from('user_roles').update({ role: 'admin' }).eq('user_id', userId);
      if (error) throw error;
      toast.success('User promoted to admin');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error promoting user:', err);
      toast.error('Failed to promote user');
      return false;
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    if (!isSuperAdmin) { toast.error('Only super admin can remove admin privileges'); return false; }
    try {
      const { error } = await supabase.from('user_roles').update({ role: 'user' }).eq('user_id', userId);
      if (error) throw error;
      toast.success('Admin privileges removed');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error demoting user:', err);
      toast.error('Failed to remove admin privileges');
      return false;
    }
  };

  const acceptSuggestion = async (suggestionId: string, userId: string) => {
    if (!isAdmin || !user) return false;
    try {
      const { error } = await supabase.from('suggestions').update({ status: 'accepted' }).eq('id', suggestionId);
      if (error) throw error;
      await supabase.from('admin_messages').insert({
        sender_id: user.id,
        title: 'Your suggestion has been accepted! 🎉',
        content: 'Thank you for your valuable suggestion! Your idea is now under development.',
      });
      toast.success('Suggestion accepted');
      fetchSuggestions();
      return true;
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error('Failed to accept suggestion');
      return false;
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    if (!isAdmin) return false;
    try {
      const { error } = await supabase.from('suggestions').delete().eq('id', suggestionId);
      if (error) throw error;
      toast.success('Suggestion deleted');
      fetchSuggestions();
      return true;
    } catch (err) {
      console.error('Error deleting suggestion:', err);
      toast.error('Failed to delete suggestion');
      return false;
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchStats(), fetchMessages(), fetchSuggestions(), fetchPolls()])
        .finally(() => setIsLoading(false));
    }
  }, [isAdmin]);

  // Realtime for polls
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin_polls_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchPolls())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  return {
    users,
    stats,
    messages,
    suggestions,
    polls,
    isLoading,
    sendBroadcastMessage,
    updateMessage,
    deleteMessage,
    createPoll,
    deletePoll,
    togglePollActive,
    deleteUser,
    promoteToAdmin,
    demoteFromAdmin,
    acceptSuggestion,
    rejectSuggestion,
    fetchUserActivity,
    refreshData: () => {
      fetchUsers(); fetchStats(); fetchMessages(); fetchSuggestions(); fetchPolls();
    },
  };
}
