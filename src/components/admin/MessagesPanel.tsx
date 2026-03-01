import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Edit, Trash2, Plus, Calendar, Eye, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';

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
  const [readCounts, setReadCounts] = useState<Record<string, { reads: number; likes: number }>>({});

  // Fetch read counts for messages
  const fetchReadCounts = async (messageId: string) => {
    const { data } = await supabase.from('message_reads').select('liked').eq('message_id', messageId);
    if (data) {
      setReadCounts(prev => ({
        ...prev,
        [messageId]: {
          reads: data.length,
          likes: data.filter(r => r.liked).length,
        },
      }));
    }
  };

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

  if (isLoading) {
    return <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Message Management</h2>
        <Button onClick={() => setShowCompose(!showCompose)} className="gap-2">
          <Plus className="h-4 w-4" /> New Message
        </Button>
      </div>

      {/* Compose */}
      <AnimatePresence>
        {showCompose && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Send className="h-4 w-4 text-primary" />Compose Broadcast</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Input placeholder="Title (optional)" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
                <Textarea placeholder="Message content..." value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={4} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)}>Cancel</Button>
                  <Button onClick={handleSend} disabled={!newContent.trim() || isSending} className="gap-2">
                    <Send className="h-4 w-4" />{isSending ? 'Sending...' : 'Send to All'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages list */}
      {messages.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 p-12 text-center">
          <MessageSquare className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No messages sent yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="absolute left-0 top-0 h-full w-1 gradient-primary" />
                  <div className="p-4 pl-5">
                    {editingId === msg.id ? (
                      <div className="space-y-3">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title" />
                        <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3} />
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="sm" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                          <Button size="sm" onClick={handleSaveEdit} className="gap-1.5"><Save className="h-4 w-4" />Save</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-foreground">{msg.title || 'Broadcast Message'}</h3>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <Calendar className="h-3 w-3" />
                              {new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => fetchReadCounts(msg.id)}>
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(msg)}>
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(msg.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground leading-relaxed line-clamp-2">{msg.content}</p>
                        {readCounts[msg.id] && (
                          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                            <span>{readCounts[msg.id].reads} reads</span>
                            <span>{readCounts[msg.id].likes} likes</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
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
