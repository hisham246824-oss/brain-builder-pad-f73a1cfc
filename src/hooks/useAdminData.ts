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
  avatar_color: string | null;
  avatar_icon: string | null;
  role: string;
  is_online: boolean;
  is_blocked: boolean;
  blocked_until: string | null;
  block_reason: string | null;
  country: string | null;
  language: string | null;
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
  totalTodos: number;
  totalPageVisits: number;
  totalPrivateMessages: number;
  blockedUsers: number;
  mostVisitedPages: { page: string; visits: number }[];
  longestDurationPages: { page: string; duration: number }[];
  recentActivity: { date: string; count: number }[];
  userGrowth: { date: string; count: number }[];
  dailyActiveUsers: { date: string; count: number }[];
  contentCreatedToday: number;
  averageSessionDuration: number;
}

interface AdminMessage {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  sender_id: string | null;
}

interface PrivateMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  title: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  is_read: boolean;
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
  peak_hours: { hour: number; visits: number }[];
  country: string | null;
  language: string | null;
  device_type: string | null;
  os: string | null;
  browser: string | null;
  xp_points: number;
  theme: string | null;
  leaderboard_rank: number | null;
  most_active_hour: number | null;
  recent_actions: { page_path: string; visited_at: string; duration_seconds: number | null }[];
  connection_type: string | null;
  downlink_mbps: number | null;
  uses_vpn: boolean | null;
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
  const { isAdmin, isMainAdmin, canModerateContent } = useUserRole();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [polls, setPolls] = useState<AdminPoll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const invokeWithRetry = useCallback(async (fnName: string, body?: object) => {
    const res = await supabase.functions.invoke(fnName, body ? { body } : undefined);
    if (res.error?.message?.includes('401') || res.error?.message?.includes('Invalid') || (!res.data && res.error)) {
      // Try refreshing session and retry once
      await supabase.auth.refreshSession();
      return supabase.functions.invoke(fnName, body ? { body } : undefined);
    }
    return res;
  }, []);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [profilesRes, rolesRes, settingsRes, blocksRes, activityRes, emailsRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
        supabase.from('user_settings').select('user_id, display_name, avatar_color, avatar_icon, language'),
        supabase.from('user_blocks').select('*'),
        supabase.from('page_visits').select('user_id, visited_at').order('visited_at', { ascending: false }),
        invokeWithRetry('admin-list-users'),
      ]);

      const emailMap: Record<string, string> = {};
      const authMetaMap: Record<string, { created_at: string | null; last_sign_in_at: string | null }> = {};
      if (emailsRes.data?.users) {
        emailsRes.data.users.forEach((u: { id: string; email: string; created_at?: string | null; last_sign_in_at?: string | null }) => {
          emailMap[u.id] = u.email;
          authMetaMap[u.id] = {
            created_at: u.created_at || null,
            last_sign_in_at: u.last_sign_in_at || null,
          };
        });
      }

      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const recentVisits = activityRes.data || [];
      const allUserIds = Array.from(new Set([
        ...(emailsRes.data?.users?.map((u: { id: string }) => u.id) || []),
        ...((profilesRes.data || []).map((profile) => profile.user_id)),
        ...((rolesRes.data || []).map((role) => role.user_id)),
        ...((settingsRes.data || []).map((setting) => setting.user_id)),
      ]));

      const usersWithRoles: UserWithProfile[] = allUserIds.map((userId) => {
        const profile = profilesRes.data?.find(p => p.user_id === userId);
        const userRole = rolesRes.data?.find(r => r.user_id === userId);
        const userSetting = settingsRes.data?.find(s => s.user_id === userId);
        const block = blocksRes.data?.find(b => b.user_id === userId && new Date(b.blocked_until) > new Date());
        const lastVisit = recentVisits.find(v => v.user_id === userId);
        const isOnline = lastVisit ? new Date(lastVisit.visited_at) > new Date(fiveMinAgo) : false;
        const email = emailMap[userId] || '';
        const fallbackName = email ? email.split('@')[0] : `User ${userId.slice(0, 6)}`;
        const createdAt = profile?.created_at || authMetaMap[userId]?.created_at || new Date().toISOString();

        return {
          id: userId,
          email,
          created_at: createdAt,
          last_sign_in_at: lastVisit?.visited_at || authMetaMap[userId]?.last_sign_in_at || null,
          display_name: userSetting?.display_name || profile?.display_name || fallbackName,
          avatar_url: profile?.avatar_url || null,
          avatar_color: userSetting?.avatar_color || 'primary',
          avatar_icon: userSetting?.avatar_icon || null,
          role: userRole?.role || 'user',
          is_online: isOnline,
          is_blocked: !!block,
          blocked_until: block?.blocked_until || null,
          block_reason: block?.reason || null,
          country: (profile as any)?.country || null,
          language: (userSetting as any)?.language || 'en',
        };
      });
      usersWithRoles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, [isAdmin]);

  const fetchUserActivity = useCallback(async (userId: string): Promise<UserActivity> => {
    const [materials, lessons, vocabulary, suggestionsRes, visits, settingsRes, profileRes, rankingRes] = await Promise.all([
      supabase.from('study_materials').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('lessons').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('vocabulary').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('suggestions').select('*', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('page_visits').select('page_path, duration_seconds, visited_at, device_type, os, browser').eq('user_id', userId).eq('is_impersonation', false).order('visited_at', { ascending: false }),
      supabase.from('user_settings').select('language, xp_points, theme').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles').select('country').eq('user_id', userId).maybeSingle(),
      supabase.from('user_settings').select('user_id, xp_points').order('xp_points', { ascending: false }),
    ]);

    const pageStats: Record<string, number> = {};
    const hourStats: Record<number, number> = {};
    let totalDuration = 0;
    let latestDevice: string | null = null;
    let latestOs: string | null = null;
    let latestBrowser: string | null = null;
    
    visits.data?.forEach((v: any, i: number) => {
      pageStats[v.page_path] = (pageStats[v.page_path] || 0) + 1;
      totalDuration += v.duration_seconds || 0;
      if (v.visited_at) {
        const hour = new Date(v.visited_at).getHours();
        hourStats[hour] = (hourStats[hour] || 0) + 1;
      }
      // Get latest device info
      if (i === 0) {
        latestDevice = v.device_type || null;
        latestOs = v.os || null;
        latestBrowser = v.browser || null;
      }
    });

    // Most visited page excluding homepage
    const nonHomePages = Object.entries(pageStats).filter(([p]) => p !== '/');
    const mostVisited = nonHomePages.sort((a, b) => b[1] - a[1])[0];
    const peakHours = Object.entries(hourStats)
      .map(([hour, count]) => ({ hour: Number(hour), visits: count }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 5);

    const rankedUsers = (rankingRes.data || []).sort((a, b) => (b.xp_points || 0) - (a.xp_points || 0));
    const leaderboardRank = rankedUsers.findIndex((entry) => entry.user_id === userId);

    return {
      materials_count: materials.count || 0,
      lessons_count: lessons.count || 0,
      vocabulary_count: vocabulary.count || 0,
      suggestions_count: suggestionsRes.count || 0,
      total_visits: visits.data?.length || 0,
      total_duration: totalDuration,
      last_active: visits.data?.[0]?.visited_at || null,
      most_visited_page: mostVisited?.[0] || null,
      peak_hours: peakHours,
      country: profileRes.data?.country || null,
      language: settingsRes.data?.language || null,
      device_type: latestDevice,
      os: latestOs,
      browser: latestBrowser,
      xp_points: (settingsRes.data as any)?.xp_points || 0,
      theme: (settingsRes.data as any)?.theme || 'light',
      leaderboard_rank: leaderboardRank >= 0 ? leaderboardRank + 1 : null,
      most_active_hour: peakHours[0]?.hour ?? null,
      recent_actions: (visits.data || []).slice(0, 8).map((visit: any) => ({
        page_path: visit.page_path,
        visited_at: visit.visited_at,
        duration_seconds: visit.duration_seconds || 0,
      })),
      connection_type: null,
      downlink_mbps: null,
      uses_vpn: null,
    };
  }, []);

  const fetchStats = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const today = new Date().toISOString().split('T')[0];
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const [totalUsers, recentVisits, pageVisits, userProfiles, settingsAll, profilesAll] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('page_visits').select('user_id, visited_at').gte('visited_at', fiveMinAgo),
        supabase.from('page_visits').select('page_path, duration_seconds, visited_at, device_type, user_id').eq('is_impersonation', false),
        supabase.from('profiles').select('created_at, country').order('created_at', { ascending: true }),
        supabase.from('user_settings').select('user_id, language, display_name'),
        supabase.from('profiles').select('user_id, created_at'),
      ]);

      // Online now = unique users with visits in last 5 min
      const onlineNow = new Set(recentVisits.data?.map(v => v.user_id)).size;

      // New users today
      const newUsersToday = profilesAll.data?.filter(p => p.created_at?.startsWith(today)).length || 0;

      // Most used language
      const langCounts: Record<string, number> = {};
      settingsAll.data?.forEach((s: any) => { const l = s.language || 'en'; langCounts[l] = (langCounts[l] || 0) + 1; });
      const mostUsedLanguage = Object.entries(langCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'en';

      // Most visited pages (excluding home)
      const pageStatsMap: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};
      const countryCounts: Record<string, number> = {};
      const userDurations: Record<string, { total: number; name: string }> = {};

      pageVisits.data?.forEach((visit: any) => {
        if (visit.page_path !== '/') {
          pageStatsMap[visit.page_path] = (pageStatsMap[visit.page_path] || 0) + 1;
        }
        if (visit.device_type) {
          deviceCounts[visit.device_type] = (deviceCounts[visit.device_type] || 0) + 1;
        }
        if (visit.user_id && visit.duration_seconds) {
          if (!userDurations[visit.user_id]) userDurations[visit.user_id] = { total: 0, name: '' };
          userDurations[visit.user_id].total += visit.duration_seconds;
        }
      });

      userProfiles.data?.forEach((p: any) => {
        if (p.country) countryCounts[p.country] = (countryCounts[p.country] || 0) + 1;
      });

      // Map display names to user durations
      settingsAll.data?.forEach((s: any) => {
        if (userDurations[s.user_id]) userDurations[s.user_id].name = s.display_name || 'User';
      });

      const mostVisitedPages = Object.entries(pageStatsMap)
        .map(([page, visits]) => ({ page, visits }))
        .sort((a, b) => b.visits - a.visits).slice(0, 5);

      const topCountries = Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count).slice(0, 5);

      const deviceStats = Object.entries(deviceCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      const topActiveUsers = Object.entries(userDurations)
        .map(([user_id, data]) => ({ user_id, display_name: data.name, total_seconds: data.total }))
        .sort((a, b) => b.total_seconds - a.total_seconds).slice(0, 10);

      setStats({
        totalUsers: totalUsers.count || 0,
        activeToday: onlineNow,
        totalMaterials: 0, totalLessons: 0, totalVocabulary: 0, totalSuggestions: 0,
        totalMessages: 0, totalPolls: 0, totalTodos: 0, totalPageVisits: 0,
        totalPrivateMessages: 0, blockedUsers: 0,
        mostVisitedPages,
        longestDurationPages: [],
        recentActivity: [],
        userGrowth: [],
        dailyActiveUsers: [],
        contentCreatedToday: 0,
        averageSessionDuration: 0,
        newUsersToday,
        mostUsedLanguage,
        topCountries,
        deviceStats,
        topActiveUsers,
      } as any);
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

  // Private messages
  const sendPrivateMessage = async (recipientId: string, title: string, content: string) => {
    if (!canModerateContent || !user) return false;
    try {
      const { error } = await supabase.from('private_messages').insert({
        sender_id: user.id,
        recipient_id: recipientId,
        title,
        content,
      });
      if (error) throw error;
      toast.success('Private message sent');
      return true;
    } catch (err) {
      console.error('Error sending private message:', err);
      toast.error('Failed to send message');
      return false;
    }
  };

  const getPrivateMessages = async (userId: string): Promise<PrivateMessage[]> => {
    if (!canModerateContent) return [];
    try {
      const { data, error } = await supabase
        .from('private_messages')
        .select('*')
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as PrivateMessage[];
    } catch {
      return [];
    }
  };

  const updatePrivateMessage = async (messageId: string, title: string, content: string) => {
    if (!canModerateContent) return false;
    try {
      const { error } = await supabase.from('private_messages')
        .update({ title, content, updated_at: new Date().toISOString() })
        .eq('id', messageId);
      if (error) throw error;
      toast.success('Message updated');
      return true;
    } catch {
      toast.error('Failed to update message');
      return false;
    }
  };

  const deletePrivateMessage = async (messageId: string) => {
    if (!canModerateContent) return false;
    try {
      const { error } = await supabase.from('private_messages').delete().eq('id', messageId);
      if (error) throw error;
      toast.success('Message deleted');
      return true;
    } catch {
      toast.error('Failed to delete message');
      return false;
    }
  };

  // Block user
  const blockUser = async (userId: string, durationHours: number, reason: string) => {
    if (!isMainAdmin || !user) return false;
    
    // Regular admins can only block regular users, not other admins
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'super_admin') {
      toast.error('Cannot block the super admin');
      return false;
    }
    try {
      const blockedUntil = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      // Remove existing block first
      await supabase.from('user_blocks').delete().eq('user_id', userId);
      const { error } = await supabase.from('user_blocks').insert({
        user_id: userId,
        blocked_by: user.id,
        reason,
        blocked_until: blockedUntil,
      });
      if (error) throw error;
      toast.success(`User blocked for ${durationHours} hours`);
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error blocking user:', err);
      toast.error('Failed to block user');
      return false;
    }
  };

  const unblockUser = async (userId: string) => {
    if (!isMainAdmin) return false;
    try {
      const { error } = await supabase.from('user_blocks').delete().eq('user_id', userId);
      if (error) throw error;
      toast.success('User unblocked');
      fetchUsers();
      return true;
    } catch {
      toast.error('Failed to unblock user');
      return false;
    }
  };

  // Message CRUD
  const sendBroadcastMessage = async (title: string, content: string, extra?: { is_pinned?: boolean; is_important?: boolean; title_translations?: Record<string, string>; content_translations?: Record<string, string> }) => {
    if (!canModerateContent || !user) return false;
    try {
      const { error } = await supabase.from('admin_messages').insert({
        sender_id: user.id, title, content,
        ...(extra?.title_translations ? { title_translations: extra.title_translations } : {}),
        ...(extra?.content_translations ? { content_translations: extra.content_translations } : {}),
      } as any);
      if (error) throw error;
      toast.success('Broadcast sent successfully');
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      return false;
    }
  };

  const updateMessage = async (messageId: string, title: string, content: string, extra?: Record<string, any>) => {
    if (!canModerateContent) return false;
    try {
      const updateData: any = { title, content };
      if (extra) Object.assign(updateData, extra);
      const { error } = await supabase.from('admin_messages').update(updateData).eq('id', messageId);
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
    if (!canModerateContent) return false;
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
    if (!canModerateContent || !user) return false;
    try {
      const { error } = await supabase.from('admin_polls').insert({
        sender_id: user.id, question, options: options as any,
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
    if (!canModerateContent) return false;
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
    if (!canModerateContent) return false;
    try {
      const { error } = await supabase.from('admin_polls').update({ is_active: isActive }).eq('id', pollId);
      if (error) throw error;
      toast.success(isActive ? 'Poll activated' : 'Poll closed');
      fetchPolls();
      return true;
    } catch { return false; }
  };

  // User management
  const deleteUser = async (userId: string, adminPassword: string) => {
    if (!isMainAdmin) { toast.error('Only the main admin can delete users'); return false; }
    try {
      // Verify admin password
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: user?.email || '', password: adminPassword });
      if (signInError) { toast.error('Incorrect admin password'); return false; }

      // Call edge function to fully delete user (data + auth account)
      const { data, error } = await supabase.functions.invoke('admin-delete-user', {
        body: { user_id: userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success('Account and all data permanently deleted');
      fetchUsers();
      fetchStats();
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('Failed to delete account');
      return false;
    }
  };

  const promoteToAdmin = async (userId: string, password: string) => {
    if (!isMainAdmin) { toast.error('Only the main admin can change admin ranks'); return false; }
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
    if (!isMainAdmin) { toast.error('Only the main admin can remove admin privileges'); return false; }
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
    if (!canModerateContent || !user) return false;
    try {
      const { error } = await supabase.from('suggestions').update({ status: 'accepted' }).eq('id', suggestionId);
      if (error) throw error;
      // Send private message to user, not broadcast
      await supabase.from('private_messages').insert({
        sender_id: user.id,
        recipient_id: userId,
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
    if (!canModerateContent) return false;
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

  // Realtime subscriptions
  useEffect(() => {
    if (!isAdmin) return;
    const channel = supabase
      .channel('admin_realtime_all')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchPolls())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => fetchMessages())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'suggestions' }, () => fetchSuggestions())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_settings' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_visits' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_blocks' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'study_materials' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vocabulary' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'private_messages' }, () => {})
      .subscribe();

    // Auto-refresh stats every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchUsers();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [isAdmin]);

  return {
    users, stats, messages, suggestions, polls, isLoading,
    sendBroadcastMessage, updateMessage, deleteMessage,
    createPoll, deletePoll, togglePollActive,
    deleteUser, promoteToAdmin, demoteFromAdmin,
    acceptSuggestion, rejectSuggestion, fetchUserActivity,
    sendPrivateMessage, getPrivateMessages, updatePrivateMessage, deletePrivateMessage,
    blockUser, unblockUser,
    refreshData: () => {
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchStats(), fetchMessages(), fetchSuggestions(), fetchPolls()])
        .finally(() => setIsLoading(false));
    },
  };
}
