import { useState, useEffect } from 'react';
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
  mostVisitedPages: { page: string; visits: number }[];
  longestDurationPages: { page: string; duration: number }[];
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

export function useAdminData() {
  const { user } = useAuth();
  const { isAdmin, isSuperAdmin } = useUserRole();
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      // Get all profiles with their roles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Get all user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Combine data
      const usersWithRoles: UserWithProfile[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        return {
          id: profile.user_id,
          email: '', // Will be populated from auth metadata if available
          created_at: profile.created_at,
          last_sign_in_at: null,
          display_name: profile.display_name,
          avatar_url: profile.avatar_url,
          role: userRole?.role || 'user',
        };
      });

      setUsers(usersWithRoles);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const fetchStats = async () => {
    if (!isAdmin) return;

    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get today's active users
      const today = new Date().toISOString().split('T')[0];
      const { count: activeToday } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('activity_date', today);

      // Get total materials
      const { count: totalMaterials } = await supabase
        .from('study_materials')
        .select('*', { count: 'exact', head: true });

      // Get total lessons
      const { count: totalLessons } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true });

      // Get page visits stats
      const { data: pageVisits } = await supabase
        .from('page_visits')
        .select('page_path, duration_seconds');

      // Aggregate page visits
      const pageStats: Record<string, { visits: number; duration: number }> = {};
      pageVisits?.forEach(visit => {
        if (!pageStats[visit.page_path]) {
          pageStats[visit.page_path] = { visits: 0, duration: 0 };
        }
        pageStats[visit.page_path].visits++;
        pageStats[visit.page_path].duration += visit.duration_seconds || 0;
      });

      const mostVisitedPages = Object.entries(pageStats)
        .map(([page, data]) => ({ page, visits: data.visits }))
        .sort((a, b) => b.visits - a.visits)
        .slice(0, 5);

      const longestDurationPages = Object.entries(pageStats)
        .map(([page, data]) => ({ page, duration: data.duration }))
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 5);

      setStats({
        totalUsers: totalUsers || 0,
        activeToday: activeToday || 0,
        totalMaterials: totalMaterials || 0,
        totalLessons: totalLessons || 0,
        mostVisitedPages,
        longestDurationPages,
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchMessages = async () => {
    if (!isAdmin) return;

    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const fetchSuggestions = async () => {
    if (!isAdmin) return;

    try {
      // Get suggestions with votes count
      const { data: suggestionsData, error: suggestionsError } = await supabase
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (suggestionsError) throw suggestionsError;

      // Get votes count for each suggestion
      const { data: votesData } = await supabase
        .from('suggestion_votes')
        .select('suggestion_id');

      // Get user profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      // Count votes per suggestion
      const votesCounts: Record<string, number> = {};
      votesData?.forEach(vote => {
        votesCounts[vote.suggestion_id] = (votesCounts[vote.suggestion_id] || 0) + 1;
      });

      // Combine data
      const suggestionsWithData: Suggestion[] = (suggestionsData || []).map(suggestion => {
        const profile = profiles?.find(p => p.user_id === suggestion.user_id);
        return {
          ...suggestion,
          votes_count: votesCounts[suggestion.id] || 0,
          user_display_name: profile?.display_name || null,
          user_email: null,
        };
      });

      // Sort by votes count (most voted first)
      suggestionsWithData.sort((a, b) => b.votes_count - a.votes_count);

      setSuggestions(suggestionsWithData);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
    }
  };

  const sendBroadcastMessage = async (title: string, content: string) => {
    if (!isAdmin || !user) return false;

    try {
      const { error } = await supabase
        .from('admin_messages')
        .insert({
          sender_id: user.id,
          title,
          content,
        });

      if (error) throw error;
      
      toast.success('تم إرسال الرسالة بنجاح');
      fetchMessages();
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('فشل في إرسال الرسالة');
      return false;
    }
  };

  const deleteUser = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error('فقط المشرف الرئيسي يمكنه حذف المستخدمين');
      return false;
    }

    try {
      // Delete user's data first
      await supabase.from('study_materials').delete().eq('user_id', userId);
      await supabase.from('vocabulary').delete().eq('user_id', userId);
      await supabase.from('profiles').delete().eq('user_id', userId);
      await supabase.from('user_roles').delete().eq('user_id', userId);

      toast.success('تم حذف الحساب بنجاح');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error deleting user:', err);
      toast.error('فشل في حذف الحساب');
      return false;
    }
  };

  const promoteToAdmin = async (userId: string, password: string) => {
    if (!isSuperAdmin) {
      toast.error('فقط المشرف الرئيسي يمكنه ترقية المستخدمين');
      return false;
    }

    // Verify password by attempting to sign in
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password,
      });

      if (signInError) {
        toast.error('كلمة المرور غير صحيحة');
        return false;
      }

      // Update role
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('تم ترقية المستخدم إلى مشرف');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error promoting user:', err);
      toast.error('فشل في ترقية المستخدم');
      return false;
    }
  };

  const demoteFromAdmin = async (userId: string) => {
    if (!isSuperAdmin) {
      toast.error('فقط المشرف الرئيسي يمكنه إزالة صلاحيات المشرف');
      return false;
    }

    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('تم إزالة صلاحيات المشرف');
      fetchUsers();
      return true;
    } catch (err) {
      console.error('Error demoting user:', err);
      toast.error('فشل في إزالة صلاحيات المشرف');
      return false;
    }
  };

  const acceptSuggestion = async (suggestionId: string, userId: string) => {
    if (!isAdmin) return false;

    try {
      // Update suggestion status
      const { error: updateError } = await supabase
        .from('suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);

      if (updateError) throw updateError;

      // Send automatic message to user (we'll handle this via admin messages)
      toast.success('تم قبول الاقتراح');
      fetchSuggestions();
      return true;
    } catch (err) {
      console.error('Error accepting suggestion:', err);
      toast.error('فشل في قبول الاقتراح');
      return false;
    }
  };

  const rejectSuggestion = async (suggestionId: string) => {
    if (!isAdmin) return false;

    try {
      const { error } = await supabase
        .from('suggestions')
        .delete()
        .eq('id', suggestionId);

      if (error) throw error;

      toast.success('تم حذف الاقتراح');
      fetchSuggestions();
      return true;
    } catch (err) {
      console.error('Error rejecting suggestion:', err);
      toast.error('فشل في حذف الاقتراح');
      return false;
    }
  };

  useEffect(() => {
    if (isAdmin) {
      setIsLoading(true);
      Promise.all([fetchUsers(), fetchStats(), fetchMessages(), fetchSuggestions()])
        .finally(() => setIsLoading(false));
    }
  }, [isAdmin]);

  return {
    users,
    stats,
    messages,
    suggestions,
    isLoading,
    sendBroadcastMessage,
    deleteUser,
    promoteToAdmin,
    demoteFromAdmin,
    acceptSuggestion,
    rejectSuggestion,
    refreshData: () => {
      fetchUsers();
      fetchStats();
      fetchMessages();
      fetchSuggestions();
    },
  };
}
