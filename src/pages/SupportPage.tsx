import { useState, useRef, useEffect } from 'react';
import { SupportSkeleton } from '@/components/skeletons/SupportSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Headphones, Plus, Send, ArrowLeft, Clock, CheckCircle2, 
  MessageCircle, Sparkles, Shield, ChevronRight, Pencil, Trash2, X, Check, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useSupportTickets, useSupportChat } from '@/hooks/useSupportTickets';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardContent className="p-16 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-secondary to-secondary/50">
              <Headphones className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <p className="mt-6 text-xl font-semibold text-foreground/80">Sign in to access Technical Support</p>
            <p className="mt-2 text-sm text-muted-foreground">Create an account to get help from our team</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedTicketId && selectedTicket) {
    return (
      <div className="max-w-3xl mx-auto">
        <SupportChatView ticket={selectedTicket} onBack={() => setSelectedTicketId(null)} />
      </div>
    );
  }

  const openCount = tickets.filter(t => t.status === 'open').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved').length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary via-primary/90 to-primary/60 shadow-lg shadow-primary/20">
            <Headphones className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Technical Support</h1>
            <p className="text-sm text-muted-foreground">Get help from our team</p>
          </div>
        </div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Button onClick={() => setShowNewDialog(true)} className="rounded-[1.25rem] gap-2 shadow-md shadow-primary/15 px-5">
            <Plus className="h-4 w-4" />New Ticket
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Stats */}
      {tickets.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <Card className="rounded-[1.75rem] overflow-hidden border-none shadow-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary to-primary/70" />
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-primary">{openCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Open</p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] overflow-hidden border-none shadow-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-green-500 to-green-400" />
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{resolvedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">Resolved</p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.75rem] overflow-hidden border-none shadow-sm">
            <div className="h-1.5 w-full bg-gradient-to-r from-muted to-transparent" />
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-foreground">{tickets.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Total</p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tickets */}
      {isLoading ? (
        <SupportSkeleton />
      ) : tickets.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-secondary to-secondary/50">
                <MessageCircle className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <p className="mt-6 text-xl font-semibold text-foreground/80">No tickets yet</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">Create a ticket to get help from our team</p>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-6">
                <Button onClick={() => setShowNewDialog(true)} className="rounded-[1.25rem] gap-2 px-6">
                  <Plus className="h-4 w-4" />Create First Ticket
                </Button>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + index * 0.04 }}
                layout
              >
                <Card
                  className={cn(
                    "rounded-[2rem] overflow-hidden border-none shadow-md cursor-pointer transition-all duration-300 hover:shadow-xl hover:translate-y-[-2px] group",
                    ticket.status === 'open' && "ring-1 ring-primary/15"
                  )}
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
                  <div className={cn(
                    "h-1.5 w-full",
                    ticket.status === 'open' ? "bg-gradient-to-r from-primary via-primary/80 to-transparent" :
                    ticket.status === 'resolved' ? "bg-gradient-to-r from-green-500 via-green-400 to-transparent" :
                    "bg-gradient-to-r from-muted to-transparent"
                  )} />
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-[1.25rem] shrink-0 transition-all",
                          ticket.status === 'open' ? "bg-primary/10" : "bg-green-500/10"
                        )}>
                          <MessageCircle className={cn(
                            "h-5 w-5",
                            ticket.status === 'open' ? "text-primary" : "text-green-600"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5">
                            <h3 className="font-semibold text-foreground truncate">{ticket.subject}</h3>
                            <span className={cn(
                              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0",
                              ticket.status === 'open' ? "bg-primary/10 text-primary" : "bg-green-500/10 text-green-600"
                            )}>
                              {ticket.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                              {ticket.status === 'open' ? 'Open' : 'Resolved'}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground/60 transition-colors shrink-0" />
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
        <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[1rem] bg-gradient-to-br from-primary to-primary/70">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg">New Support Ticket</span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-5 mt-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Subject</label>
              <Input
                placeholder="Brief description of your issue..."
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="rounded-[1.25rem] h-12"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Message</label>
              <Textarea
                placeholder="Describe your issue in detail..."
                value={firstMessage}
                onChange={e => setFirstMessage(e.target.value)}
                className="rounded-[1.25rem] min-h-[130px] resize-none"
              />
            </div>
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs text-muted-foreground">{firstMessage.length} characters</span>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                <Button
                  onClick={handleCreate}
                  disabled={!subject.trim() || !firstMessage.trim() || isSubmitting}
                  className="gap-2 rounded-[1.25rem] px-6 shadow-md shadow-primary/15"
                >
                  <Send className="h-4 w-4" />{isSubmitting ? 'Creating...' : 'Submit Ticket'}
                </Button>
              </motion.div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportChatView({ ticket, onBack }: { ticket: any; onBack: () => void }) {
  const { user } = useAuth();
  const { messages, isLoading, sendMessage, editMessage, deleteMessage } = useSupportChat(ticket.id);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB');
      return;
    }

    try {
      const ext = file.name.split('.').pop();
      const path = `support/${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('material-files')
        .upload(path, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('material-files')
        .getPublicUrl(path);

      await sendMessage('', false, urlData.publicUrl);
      toast.success('Image sent');
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartEdit = (msg: any) => {
    setEditingId(msg.id);
    setEditContent(msg.content);
    setContextMenuId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await editMessage(editingId, editContent);
    setEditingId(null);
    setEditContent('');
  };

  const handleDelete = async (msgId: string) => {
    setContextMenuId(null);
    await deleteMessage(msgId);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-5">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-[1.25rem] h-11 w-11">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </motion.div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-foreground truncate text-lg">{ticket.subject}</h2>
          <span className={cn(
            "inline-flex items-center gap-1 text-xs font-semibold",
            ticket.status === 'open' ? "text-primary" : "text-green-600"
          )}>
            {ticket.status === 'open' ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
            {ticket.status === 'open' ? 'Open' : 'Resolved'}
          </span>
        </div>
      </motion.div>

      {/* Messages */}
      <Card className="rounded-[2rem] border-none shadow-lg flex-1 overflow-hidden flex flex-col">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4" onClick={() => setContextMenuId(null)}>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-secondary/50">
                <MessageCircle className="h-8 w-8 text-muted-foreground/30" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">No messages yet — start the conversation!</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                const isEditing = editingId === msg.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    className={cn("flex group relative", isMe ? "justify-end" : "justify-start")}
                  >
                    {!isMe && (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/70 mr-2.5 shrink-0 mt-1">
                        <Shield className="h-3.5 w-3.5 text-primary-foreground" />
                      </div>
                    )}
                    <div className="relative max-w-[75%]">
                      {/* Context menu for own messages */}
                      {isMe && !isEditing && contextMenuId === msg.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute -top-10 right-0 z-10 flex items-center gap-1 bg-card rounded-2xl shadow-xl border border-border/50 p-1"
                        >
                          <button
                            onClick={() => handleStartEdit(msg)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-secondary transition-colors"
                          >
                            <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-xl hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </motion.div>
                      )}

                      {/* Bubble */}
                      <div
                        onClick={(e) => {
                          if (isMe && !isEditing) {
                            e.stopPropagation();
                            setContextMenuId(contextMenuId === msg.id ? null : msg.id);
                          }
                        }}
                        className={cn(
                          "px-5 py-3.5 cursor-default",
                          isMe
                            ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-[1.75rem] rounded-br-md shadow-md shadow-primary/15"
                            : "bg-gradient-to-br from-secondary to-secondary/70 text-foreground rounded-[1.75rem] rounded-bl-md shadow-sm",
                          isMe && !isEditing && "cursor-pointer"
                        )}
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <Textarea
                              value={editContent}
                              onChange={e => setEditContent(e.target.value)}
                              className="min-h-[40px] resize-none bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground placeholder:text-primary-foreground/50 rounded-xl text-sm"
                              rows={2}
                              autoFocus
                            />
                            <div className="flex items-center gap-2 justify-end">
                              <button
                                onClick={() => { setEditingId(null); setEditContent(''); }}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/20 hover:bg-primary-foreground/30 transition-colors"
                              >
                                <X className="h-3.5 w-3.5 text-primary-foreground" />
                              </button>
                              <button
                                onClick={handleSaveEdit}
                                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-foreground/30 hover:bg-primary-foreground/40 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5 text-primary-foreground" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            {/* Attachment image */}
                            {msg.attachment_url && (
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="max-w-full rounded-xl mb-2 max-h-60 object-cover"
                              />
                            )}
                            {msg.content && msg.content !== '📎 Attachment' && (
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            )}
                          </>
                        )}
                        <div className={cn(
                          "flex items-center gap-1.5 mt-2 text-[10px]",
                          isMe ? "text-primary-foreground/50 justify-end" : "text-muted-foreground/70"
                        )}>
                          {msg.is_admin && <span className="font-semibold">Admin</span>}
                          {msg.is_admin && <span>·</span>}
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Redesigned Input Area - rectangular bar with sharp curves */}
        <div className="border-t border-border/30 p-4 bg-gradient-to-t from-card to-transparent">
          <div className="flex items-center gap-0 bg-secondary/60 rounded-[1.5rem] border border-border/40 px-1.5 py-1.5">
            {/* (+) Attachment button on the far left */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 hover:bg-primary/20 transition-colors shrink-0"
            >
              <Plus className="h-5 w-5 text-primary" />
            </motion.button>

            {/* Text input */}
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              className="flex-1 bg-transparent border-none outline-none px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />

            {/* Circular send button on the far right */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.85 }}
              onClick={handleSend}
              disabled={!newMessage.trim() || isSending}
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full shrink-0 transition-all duration-200",
                newMessage.trim()
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/25"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Send className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </Card>
    </div>
  );
}
