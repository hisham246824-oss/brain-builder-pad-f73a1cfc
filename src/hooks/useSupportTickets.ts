import { useState, useEffect, useCallback } from 'react';
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
}

export function useSupportTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      setTickets(data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Realtime for tickets
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('support-tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => {
        fetchTickets();
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

  // Realtime for messages
  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`support-messages-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'support_messages',
        filter: `ticket_id=eq.${ticketId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as SupportMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  const sendMessage = useCallback(async (content: string, isAdmin: boolean = false) => {
    if (!user || !ticketId || !content.trim()) return;
    try {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticketId,
        sender_id: user.id,
        content: content.trim(),
        is_admin: isAdmin,
      });
      if (error) throw error;

      // Update ticket timestamp
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    }
  }, [user, ticketId]);

  return { messages, isLoading, sendMessage, refetch: fetchMessages };
}
