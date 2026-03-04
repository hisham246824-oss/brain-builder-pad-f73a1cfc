import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Edit, Trash2, Plus, Calendar, Eye, Save, X,
  Search, Pin, PinOff, Copy, Clock, Users, Heart, CheckCheck,
  Filter, ArrowUpDown, AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminMessage {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  sender_id: string | null;
}

interface MessagesPanelProps {
  messages: AdminMessage[];
  isLoading: boolean;
  onSendBroadcast: (title: string, content: string) => Promise<boolean>;
  onUpdateMessage: (id: string, title: string, content: string) => Promise<boolean>;
  onDeleteMessage: (id: string) => Promise<boolean>;
}

export function MessagesPanel({ messages, isLoading, onSendBroadcast, onUpdateMessage, onDeleteMessage }: MessagesPanelProps) {
  const [showCompose, setShowCompose] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [readCounts, setReadCounts] = useState<Record<string, { reads: number; likes: number; total: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [pinnedMessages, setPinnedMessages] = useState<Set<string>>(new Set());
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [previewMessage, setPreviewMessage] = useState<AdminMessage | null>(null);

  // Fetch read counts for all messages
  useEffect(() => {
    const fetchAllReadCounts = async () => {
      const totalUsersRes = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const totalUsersCount = totalUsersRes.count || 0;
      for (const msg of messages) {
        const { data } = await supabase.from('message_reads').select('liked').eq('message_id', msg.id);
        if (data) {
          setReadCounts(prev => ({
            ...prev,
            [msg.id]: { reads: data.length, likes: data.filter(r => r.liked).length, total: totalUsersCount },
          }));
        }
      }
    };
    if (messages.length > 0) fetchAllReadCounts();
  }, [messages]);

  const handleSend = async () => {
    if (!newContent.trim()) return;
    setIsSending(true);
    const success = await onSendBroadcast(newTitle, newContent);
    if (success) { setNewTitle(''); setNewContent(''); setShowCompose(false); }
    setIsSending(false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editContent.trim()) return;
    await onUpdateMessage(editingId, editTitle, editContent);
    setEditingId(null);
  };

  const startEdit = (msg: AdminMessage) => {
    setEditingId(msg.id);
    setEditTitle(msg.title || '');
    setEditContent(msg.content);
  };

  const handleCopyContent = (msg: AdminMessage) => {
    navigator.clipboard.writeText(msg.content);
    toast.success('Message content copied');
  };

  const togglePin = (id: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleBulkDelete = async () => {
    for (const id of selectedMessages) {
      await onDeleteMessage(id);
    }
    setSelectedMessages(new Set());
    toast.success(`${selectedMessages.size} messages deleted`);
  };

  let filteredMessages = messages.filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by date
  filteredMessages = [...filteredMessages].sort((a, b) => {
    const aPinned = pinnedMessages.has(a.id) ? 1 : 0;
    const bPinned = pinnedMessages.has(b.id) ? 1 : 0;
    if (aPinned !== bPinned) return bPinned - aPinned;
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
  });

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Broadcast Messages</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{messages.length} total messages sent</p>
        </div>
        <div className="flex gap-2">
          {selectedMessages.size > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-1">
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedMessages.size})
            </Button>
          )}
          <Button onClick={() => setShowCompose(!showCompose)} className="gap-2">
            <Plus className="h-4 w-4" /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Search & Sort */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search messages..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Button variant="outline" size="icon" onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}>
          <ArrowUpDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Compose */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4 text-primary" />Compose Broadcast</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>This message will be sent to ALL users. For private messages, use the Accounts panel.</span>
                </div>
                <Input placeholder="Title (optional)" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                <Textarea placeholder="Message content..." value={newContent} onChange={e => setNewContent(e.target.value)} rows={4} />
                <p className="text-xs text-muted-foreground">{newContent.length} characters</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button onClick={handleSend} disabled={!newContent.trim() || isSending} className="gap-2">
                    <Send className="h-4 w-4" />{isSending ? 'Sending...' : 'Send to All Users'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages list */}
      {filteredMessages.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 p-12 text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No messages found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMessages.map((msg, i) => {
            const stats = readCounts[msg.id];
            const readPct = stats && stats.total > 0 ? Math.round((stats.reads / stats.total) * 100) : 0;
            const isPinned = pinnedMessages.has(msg.id);
            const isSelected = selectedMessages.has(msg.id);

            return (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                <Card className={cn("overflow-hidden transition-all", isPinned && "border-primary/30 bg-primary/5", isSelected && "ring-2 ring-primary")}>
                  <CardContent className="p-0">
                    <div className={cn("absolute left-0 top-0 h-full w-1", isPinned ? "bg-primary" : "bg-muted")} />
                    <div className="p-4 pl-5">
                      {editingId === msg.id ? (
                        <div className="space-y-3">
                          <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} placeholder="Title" />
                          <Textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                            <Button size="sm" onClick={handleSaveEdit} className="gap-1.5"><Save className="h-4 w-4" />Save</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {isPinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                                <h3 className="font-semibold text-foreground">{msg.title || 'Broadcast Message'}</h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                <Calendar className="h-3 w-3" />
                                {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePin(msg.id)}>
                                {isPinned ? <PinOff className="h-3.5 w-3.5 text-primary" /> : <Pin className="h-3.5 w-3.5 text-muted-foreground" />}
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopyContent(msg)}>
                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(msg)}>
                                <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteId(msg.id)}>
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                              </Button>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{msg.content}</p>
                          {stats && (
                            <div className="mt-3 space-y-2">
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1"><CheckCheck className="h-3 w-3" /> {stats.reads} reads</span>
                                <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {stats.likes} likes</span>
                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {readPct}% reached</span>
                              </div>
                              <Progress value={readPct} className="h-1" />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>This message will be permanently deleted for all users.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeleteMessage(deleteId); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
