import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Headphones, Search, ArrowLeft, Send, Clock, CheckCircle2,
  User, MessageCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_display_name?: string;
  user_email?: string;
  last_message?: string;
  unread_count?: number;
}

interface Message {
  id: string;
  ticket_id: string;
  sender_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
}

export function SupportPanel() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchTickets = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: ticketsData, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;

      // Get user info
      const userIds = [...new Set(ticketsData?.map(t => t.user_id) || [])];
      const { data: userSettings } = await supabase
        .from('user_settings')
        .select('user_id, display_name')
        .in('user_id', userIds);

      // Get last message per ticket
      const enriched: Ticket[] = await Promise.all((ticketsData || []).map(async (t) => {
        const settings = userSettings?.find(u => u.user_id === t.user_id);
        const { data: lastMsg } = await supabase
          .from('support_messages')
          .select('content')
          .eq('ticket_id', t.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        return {
          ...t,
          user_display_name: settings?.display_name || null,
          last_message: lastMsg?.content || '',
        };
      }));

      setTickets(enriched);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel('admin-support-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => fetchTickets())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTickets]);

  const filteredTickets = tickets.filter(t => {
    const matchSearch = t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.user_display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  if (selectedTicketId && selectedTicket) {
    return <AdminChatView ticket={selectedTicket} onBack={() => setSelectedTicketId(null)} onStatusChange={fetchTickets} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70">
          <Headphones className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Technical Support</h2>
          <p className="text-sm text-muted-foreground">{tickets.length} total • {openCount} open • {resolvedCount} resolved</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-primary to-primary/70" />
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{openCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Open Tickets</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-green-500 to-green-400" />
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
            <p className="text-xs text-muted-foreground mt-1">Resolved</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
          <div className="h-1 w-full bg-gradient-to-r from-muted to-transparent" />
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-foreground">{tickets.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
        <CardContent className="p-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search tickets..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-2xl border-none bg-secondary/50" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] rounded-2xl border-none bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Ticket list */}
      {isLoading ? (
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-secondary" />)}</div>
      ) : filteredTickets.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Headphones className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">No tickets found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredTickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                layout
              >
                <Card
                  className={cn(
                    "rounded-3xl overflow-hidden border-none shadow-sm cursor-pointer transition-all hover:shadow-lg",
                    ticket.status === 'open' && "ring-1 ring-primary/20"
                  )}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className={cn(
                    "h-1 w-full",
                    ticket.status === 'open' ? "bg-gradient-to-r from-primary to-primary/70" : "bg-gradient-to-r from-green-500 to-green-400"
                  )} />
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary shrink-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shrink-0",
                            ticket.status === 'open' ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
                          )}>
                            {ticket.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {ticket.status === 'open' ? 'Open' : 'Resolved'}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {ticket.user_display_name || 'User'} • {new Date(ticket.updated_at).toLocaleDateString()}
                        </p>
                        {ticket.last_message && (
                          <p className="mt-2 text-sm text-muted-foreground/80 truncate">{ticket.last_message}</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function AdminChatView({ ticket, onBack, onStatusChange }: { ticket: Ticket; onBack: () => void; onStatusChange: () => void }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('ticket_id', ticket.id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [ticket.id]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`admin-chat-${ticket.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'support_messages',
        filter: `ticket_id=eq.${ticket.id}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticket.id]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user || isSending) return;
    setIsSending(true);
    const msg = newMessage.trim();
    setNewMessage('');
    
    // Optimistic: add message instantly to UI
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      ticket_id: ticket.id,
      sender_id: user.id,
      content: msg,
      is_admin: true,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    try {
      const { error } = await supabase.from('support_messages').insert({
        ticket_id: ticket.id,
        sender_id: user.id,
        content: msg,
        is_admin: true,
      });
      if (error) throw error;
      await supabase.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticket.id);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Failed to send message');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setIsSending(false);
    }
  };

  const toggleStatus = async () => {
    const newStatus = ticket.status === 'open' ? 'resolved' : 'open';
    try {
      await supabase.from('support_tickets').update({ status: newStatus }).eq('id', ticket.id);
      toast.success(`Ticket marked as ${newStatus}`);
      onStatusChange();
    } catch {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{ticket.subject}</h2>
          <p className="text-sm text-muted-foreground">{ticket.user_display_name || 'User'}</p>
        </div>
        <Button onClick={toggleStatus} variant="outline" className={cn("rounded-2xl gap-2", ticket.status === 'open' ? "text-green-600" : "text-primary")}>
          {ticket.status === 'open' ? <><CheckCircle2 className="h-4 w-4" />Resolve</> : <><Clock className="h-4 w-4" />Reopen</>}
        </Button>
      </div>

      {/* Chat */}
      <Card className="rounded-3xl border-none shadow-sm overflow-hidden flex flex-col" style={{ height: 'calc(100vh - 16rem)' }}>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No messages yet</div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isAdmin = msg.is_admin;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[80%] rounded-3xl px-5 py-3",
                      isAdmin
                        ? "bg-primary text-primary-foreground rounded-br-lg"
                        : "bg-secondary text-foreground rounded-bl-lg"
                    )}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1.5 text-[10px]",
                        isAdmin ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                      )}>
                        <span>{isAdmin ? 'Admin' : 'User'}</span>
                        <span>·</span>
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-3 items-end">
            <Textarea
              placeholder="Type your reply..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="rounded-2xl min-h-[44px] max-h-[120px] resize-none flex-1"
              rows={1}
            />
            <Button onClick={handleSend} disabled={!newMessage.trim() || isSending} size="icon" className="rounded-2xl h-11 w-11 shrink-0">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
