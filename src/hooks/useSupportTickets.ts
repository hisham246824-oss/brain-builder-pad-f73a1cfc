import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  attachment_url?: string | null;
}

export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const fetchTickets = useCallback(async (silent = false) => {
    if (!user) return;
    if (!silent && !hasLoadedOnce.current) setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('support-tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets(true);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTickets]);

  const createTicket = useCallback(async (subject: string, firstMessage: string) => {
    if (!user) return null;
    try {
      const { data: ticket, error: ticketErr } = await supabase
        .from('support_tickets')
        .insert({ user_id: user.id, subject })
        .select()
        .single();
      if (ticketErr) throw ticketErr;

      const { error: msgErr } = await supabase
        .from('support_messages')
        .insert({ ticket_id: ticket.id, sender_id: user.id, content: firstMessage, is_admin: false });
      if (msgErr) throw msgErr;

      toast.success('Support ticket created!');
      fetchTickets();
      return ticket;
    } catch (err) {
      console.error('Error creating ticket:', err);
      toast.error('Failed to create ticket');
      return null;
    }
  }, [user, fetchTickets]);

  return { tickets, isLoading, createTicket, refetch: fetchTickets };
}

export function useSupportChat(ticketId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) { setMessages([]); return; }
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as SupportMessage;
          setMessages(prev => {
            // Replace optimistic message if exists
            const hasTemp = prev.some(m => m.id.startsWith('temp-') && m.content === newMsg.content);
            if (hasTemp) {
              return prev.map(m => m.id.startsWith('temp-') && m.content === newMsg.content ? newMsg : m);
            }
            // Avoid duplicates
            if (prev.some(m => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        } else if (payload.eventType === 'UPDATE') {
          setMessages(prev => prev.map(m => m.id === (payload.new as SupportMessage).id ? payload.new as SupportMessage : m));
        } else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== (payload.old as any).id));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  const sendMessage = useCallback(async (content: string, isAdmin: boolean = false, attachmentUrl?: string) => {
    if (!user || !ticketId || (!content.trim() && !attachmentUrl)) return;
    
    // Optimistic update
    const optimisticMsg: SupportMessage = {
      id: `temp-${Date.now()}`,
      ticket_id: ticketId,
      sender_id: user.id,
      content: content.trim() || '📎 Attachment',
      is_admin: isAdmin,
      created_at: new Date().toISOString(),
      attachment_url: attachmentUrl || null,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const insertData: any = {
        ticket_id: ticketId,
        sender_id: user.id,
        content: content.trim() || '📎 Attachment',
        is_admin: isAdmin,
      };
      if (attachmentUrl) insertData.attachment_url = attachmentUrl;

      const { error } = await supabase.from('support_messages').insert(insertData);
      if (error) throw error;

      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    }
  }, [user, ticketId]);

  const editMessage = useCallback(async (messageId: string, newContent: string) => {
    if (!newContent.trim()) return;
    try {
      const { error } = await supabase
        .from('support_messages')
        .update({ content: newContent.trim() })
        .eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: newContent.trim() } : m));
    } catch (err) {
      console.error('Error editing message:', err);
      toast.error('Failed to edit message');
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('support_messages')
        .delete()
        .eq('id', messageId);
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    } catch (err) {
      console.error('Error deleting message:', err);
      toast.error('Failed to delete message');
    }
  }, []);

  return { messages, isLoading, sendMessage, editMessage, deleteMessage, refetch: fetchMessages };
}
