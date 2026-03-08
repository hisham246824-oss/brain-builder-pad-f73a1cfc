import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Edit, Trash2, Plus, Calendar, Save, X,
  Search, Pin, PinOff, Copy, Users, Heart, CheckCheck,
  ArrowUpDown, AlertTriangle, Sparkles
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
    if (success) { 
      setNewTitle(''); 
      setNewContent(''); 
      setShowCompose(false); 
      toast.success('Broadcast sent to all users!', { icon: '📢' });
    }
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
    toast.success('Message copied to clipboard');
  };

  const togglePin = (id: string) => {
    setPinnedMessages(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-3xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Broadcast Center</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {messages.length} message{messages.length !== 1 ? 's' : ''} • Instant delivery to all users
          </p>
        </div>
        <Button onClick={() => setShowCompose(!showCompose)} className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4" /> New Broadcast
        </Button>
      </div>

      {/* Search & Sort Bar */}
      <div className="flex">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search messages..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
            className="pl-10 rounded-l-2xl rounded-r-none border-r-0" 
          />
        </div>
        <Button 
          variant="outline" 
          onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
          className="rounded-l-none rounded-r-2xl border-l-0 gap-2"
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
        </Button>
      </div>

      {/* Compose Card */}
      <AnimatePresence>
        {showCompose && (
          <motion.div 
            initial={{ opacity: 0, y: -10, height: 0 }} 
            animate={{ opacity: 1, y: 0, height: 'auto' }} 
            exit={{ opacity: 0, y: -10, height: 0 }}
          >
            <Card className="rounded-3xl border-primary/30 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Compose New Broadcast
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>This message will be instantly delivered to <strong>all users</strong>. For private messages, use the Accounts panel.</span>
                </div>
                <Input 
                  placeholder="Message title (optional)" 
                  value={newTitle} 
                  onChange={e => setNewTitle(e.target.value)} 
                  className="rounded-2xl"
                />
                <Textarea 
                  placeholder="Write your message here..." 
                  value={newContent} 
                  onChange={e => setNewContent(e.target.value)} 
                  rows={4} 
                  className="rounded-2xl resize-none"
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{newContent.length} characters</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCompose(false)} className="rounded-2xl">
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSend} 
                      disabled={!newContent.trim() || isSending} 
                      className="gap-2 rounded-2xl"
                    >
                      <Send className="h-4 w-4" />
                      {isSending ? 'Sending...' : 'Send Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages List */}
      {filteredMessages.length === 0 ? (
        <div className="rounded-3xl bg-secondary/50 p-16 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <MessageSquare className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">No broadcasts yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first broadcast to reach all users instantly</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((msg, i) => {
            const stats = readCounts[msg.id];
            const readPct = stats && stats.total > 0 ? Math.round((stats.reads / stats.total) * 100) : 0;
            const isPinned = pinnedMessages.has(msg.id);

            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.02 }}
              >
                <Card className={cn(
                  "rounded-3xl overflow-hidden transition-all hover:shadow-lg",
                  isPinned && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent"
                )}>
                  <CardContent className="p-0">
                    {/* Accent bar */}
                    <div className={cn(
                      "h-1 w-full",
                      isPinned ? "bg-gradient-to-r from-primary to-primary/50" : "bg-gradient-to-r from-muted to-transparent"
                    )} />
                    
                    <div className="p-5">
                      {editingId === msg.id ? (
                        <div className="space-y-3">
                          <Input 
                            value={editTitle} 
                            onChange={e => setEditTitle(e.target.value)} 
                            placeholder="Title" 
                            className="rounded-2xl"
                          />
                          <Textarea 
                            value={editContent} 
                            onChange={e => setEditContent(e.target.value)} 
                            rows={3} 
                            className="rounded-2xl resize-none"
                          />
                          <div className="flex gap-2 justify-end">
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)} className="rounded-xl">
                              <X className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={handleSaveEdit} className="gap-1.5 rounded-xl">
                              <Save className="h-4 w-4" /> Save Changes
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {isPinned && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                    <Pin className="h-3 w-3" /> Pinned
                                  </span>
                                )}
                                <h3 className="font-semibold text-foreground truncate">
                                  {msg.title || 'Broadcast Message'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(msg.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl" 
                                onClick={() => togglePin(msg.id)}
                              >
                                {isPinned ? (
                                  <PinOff className="h-4 w-4 text-primary" />
                                ) : (
                                  <Pin className="h-4 w-4 text-muted-foreground" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl" 
                                onClick={() => handleCopyContent(msg)}
                              >
                                <Copy className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl" 
                                onClick={() => startEdit(msg)}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-xl" 
                                onClick={() => setDeleteId(msg.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>

                          {/* Message Content */}
                          <div className="mt-4 p-4 rounded-2xl bg-secondary/50">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>

                          {/* Stats */}
                          {stats && (
                            <div className="mt-4 space-y-2">
                              <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <CheckCheck className="h-3.5 w-3.5 text-green-500" /> 
                                  <span className="font-medium text-foreground">{stats.reads}</span> reads
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground">
                                  <Heart className="h-3.5 w-3.5 text-red-500" /> 
                                  <span className="font-medium text-foreground">{stats.likes}</span> likes
                                </span>
                                <span className="flex items-center gap-1.5 text-muted-foreground ml-auto">
                                  <Users className="h-3.5 w-3.5" /> 
                                  <span className="font-medium text-foreground">{readPct}%</span> reached
                                </span>
                              </div>
                              <Progress value={readPct} className="h-1.5 rounded-full" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Broadcast</AlertDialogTitle>
            <AlertDialogDescription>
              This message will be permanently deleted and removed from all users' message history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => { if (deleteId) onDeleteMessage(deleteId); setDeleteId(null); }} 
              className="bg-destructive text-destructive-foreground rounded-2xl"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
