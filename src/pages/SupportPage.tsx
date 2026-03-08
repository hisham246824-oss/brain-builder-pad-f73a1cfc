import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, Plus, Send, ArrowLeft, Clock, CheckCircle2, 
  MessageCircle, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets, useSupportChat } from '@/hooks/useSupportTickets';

export default function SupportPage() {
  const { user } = useAuth();
  const { tickets, isLoading, createTicket } = useSupportTickets();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [subject, setSubject] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedTicket = tickets.find(t => t.id === selectedTicketId);

  const handleCreate = async () => {
    if (!subject.trim() || !firstMessage.trim()) return;
    setIsSubmitting(true);
    const ticket = await createTicket(subject.trim(), firstMessage.trim());
    if (ticket) {
      setSubject('');
      setFirstMessage('');
      setShowNewDialog(false);
      setSelectedTicketId(ticket.id);
    }
    setIsSubmitting(false);
  };

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <Headphones className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">Sign in to access Technical Support</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Chat view
  if (selectedTicketId && selectedTicket) {
    return (
      <div className="max-w-3xl mx-auto">
        <SupportChatView
          ticket={selectedTicket}
          onBack={() => setSelectedTicketId(null)}
        />
      </div>
    );
  }

  // Tickets list view
  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70">
            <Headphones className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Technical Support</h1>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button onClick={() => setShowNewDialog(true)} className="rounded-2xl gap-2 shadow-sm">
            <Plus className="h-4 w-4" />New Ticket
          </Button>
        </motion.div>
      </motion.div>

      {/* Tickets */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 animate-pulse rounded-3xl bg-secondary" />)}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <MessageCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">No tickets yet</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Create a ticket to get help from our team</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
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
                    ticket.status === 'open' ? "bg-gradient-to-r from-primary to-primary/70" :
                    ticket.status === 'resolved' ? "bg-gradient-to-r from-green-500 to-green-400" :
                    "bg-gradient-to-r from-muted to-transparent"
                  )} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                            ticket.status === 'open' ? "bg-primary/10 text-primary" :
                            ticket.status === 'resolved' ? "bg-green-500/10 text-green-600" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {ticket.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                            {ticket.status === 'open' ? 'Open' : 'Resolved'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
                        <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* New Ticket Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              New Support Ticket
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
              <Input
                placeholder="Brief description of your issue..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="rounded-2xl"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                className="rounded-2xl min-h-[120px] resize-none"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">{firstMessage.length} characters</span>
              <Button
                onClick={handleCreate}
                disabled={!subject.trim() || !firstMessage.trim() || isSubmitting}
                className="gap-2 rounded-2xl"
              >
                <Send className="h-4 w-4" />{isSubmitting ? 'Creating...' : 'Submit Ticket'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportChatView({ ticket, onBack }: { ticket: any; onBack: () => void }) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage } = useSupportChat(ticket.id);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return;
    setIsSending(true);
    const msg = newMessage;
    setNewMessage('');
    await sendMessage(msg, false);
    setIsSending(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="rounded-2xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate">{ticket.subject}</h2>
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            ticket.status === 'open' ? "text-primary" : "text-green-600"
          )}>
            {ticket.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {ticket.status === 'open' ? 'Open' : 'Resolved'}
          </span>
        </div>
      </motion.div>

      {/* Messages */}
      <Card className="rounded-3xl border-none shadow-sm flex-1 overflow-hidden flex flex-col">
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
                const isMe = msg.sender_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[80%] rounded-3xl px-5 py-3",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-lg"
                        : "bg-secondary text-foreground rounded-bl-lg"
                    )}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      <div className={cn(
                        "flex items-center gap-1 mt-1.5 text-[10px]",
                        isMe ? "text-primary-foreground/60 justify-end" : "text-muted-foreground"
                      )}>
                        {msg.is_admin && <span className="font-medium">Admin</span>}
                        {msg.is_admin && <span>·</span>}
                        <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border/50 p-4">
          <div className="flex gap-3 items-end">
            <Textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="rounded-2xl min-h-[44px] max-h-[120px] resize-none flex-1"
              rows={1}
            />
            <Button
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              size="icon"
              className="rounded-2xl h-11 w-11 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
