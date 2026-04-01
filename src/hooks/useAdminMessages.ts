import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface AdminMessage {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  isRead: boolean;
  isLiked: boolean;
  is_pinned?: boolean;
  is_important?: boolean;
  title_translations?: Record<string, string> | null;
  content_translations?: Record<string, string> | null;
}

export function useAdminMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const cached = localStorage.getItem('studyhub-unread-count');
      return cached ? parseInt(cached, 10) : 0;
    } catch { return 0; }
  });
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchMessages = async (silent = false) => {
    if (!user) {
      setMessages([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }

    if (!silent && !hasLoadedOnce.current) setIsLoading(true);
    try {
      // Get all admin messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('admin_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (messagesError) throw messagesError;

      // Get user's read status
      const { data: readsData, error: readsError } = await supabase
        .from('message_reads')
        .select('*')
        .eq('user_id', user.id);

      if (readsError) throw readsError;

      // Combine data
      const messagesWithStatus: AdminMessage[] = (messagesData || []).map(msg => {
        const readStatus = readsData?.find(r => r.message_id === msg.id);
        return {
          id: msg.id,
          title: msg.title,
          content: msg.content,
          created_at: msg.created_at,
          isRead: !!readStatus,
          isLiked: readStatus?.liked || false,
          is_pinned: (msg as any).is_pinned || false,
          is_important: (msg as any).is_important || false,
          title_translations: (msg as any).title_translations || null,
          content_translations: (msg as any).content_translations || null,
        };
      });

      setMessages(messagesWithStatus);
      hasLoadedOnce.current = true;
      const count = messagesWithStatus.filter(m => !m.isRead).length;
      setUnreadCount(count);
      try { localStorage.setItem('studyhub-unread-count', String(count)); } catch {}
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          read_at: new Date().toISOString(),
        }, {
          onConflict: 'message_id,user_id',
        });

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isRead: true } : m
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const toggleLike = async (messageId: string) => {
    if (!user) return;

    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    try {
      const { error } = await supabase
        .from('message_reads')
        .upsert({
          message_id: messageId,
          user_id: user.id,
          liked: !message.isLiked,
          read_at: new Date().toISOString(),
        }, {
          onConflict: 'message_id,user_id',
        });

      if (error) throw error;

      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, isLiked: !m.isLiked, isRead: true } : m
      ));
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const markAllAsRead = async () => {
    if (!user || messages.length === 0) return;

    try {
      const unreadMessages = messages.filter(m => !m.isRead);
      
      if (unreadMessages.length === 0) return;

      const inserts = unreadMessages.map(m => ({
        message_id: m.id,
        user_id: user.id,
        read_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('message_reads')
        .upsert(inserts, {
          onConflict: 'message_id,user_id',
        });

      if (error) throw error;

      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('admin_messages_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_messages' },
        () => { fetchMessages(true); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // Background refetch on tab focus
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchMessages(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user]);

  return {
    messages,
    unreadCount,
    isLoading,
    markAsRead,
    toggleLike,
    markAllAsRead,
    hasUnread: unreadCount > 0,
  };
}
