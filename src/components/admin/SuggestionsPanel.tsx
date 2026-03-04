import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, ThumbsUp, Check, X, User, Calendar, Send, Trash2,
  Search, Filter, ArrowUpDown, MessageSquare, Clock, TrendingUp,
  CheckCircle2, XCircle, Eye, Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onAccept: (suggestionId: string, userId: string) => Promise<boolean>;
  onReject: (suggestionId: string) => Promise<boolean>;
}

export function SuggestionsPanel({ suggestions, isLoading, onAccept, onReject }: SuggestionsPanelProps) {
  const { user } = useAuth();
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);
  const [messageTarget, setMessageTarget] = useState<Suggestion | null>(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('votes');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = async () => {
    if (!selectedSuggestion || !actionType) return;
    if (actionType === 'accept') await onAccept(selectedSuggestion.id, selectedSuggestion.user_id);
    else await onReject(selectedSuggestion.id);
    setSelectedSuggestion(null);
    setActionType(null);
  };

  const handleSendMessage = async () => {
    if (!messageTarget || !messageContent.trim() || !user) return;
    setIsSending(true);
    try {
      // Send as private message, not broadcast
      const { error } = await supabase.from('private_messages').insert({
        sender_id: user.id,
        recipient_id: messageTarget.user_id,
        title: messageTitle.trim() || `Re: ${messageTarget.title}`,
        content: messageContent.trim(),
      });
      if (error) throw error;
      toast.success('Private message sent to user');
      setMessageTarget(null);
      setMessageTitle('');
      setMessageContent('');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  let filteredSuggestions = suggestions.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  filteredSuggestions = [...filteredSuggestions].sort((a, b) => {
    if (sortBy === 'votes') return b.votes_count - a.votes_count;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return 0;
  });

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const totalVotes = suggestions.reduce((sum, s) => sum + s.votes_count, 0);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600 border border-green-500/20"><Check className="h-3 w-3" />Accepted</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive border border-destructive/20"><X className="h-3 w-3" />Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 border border-amber-500/20"><Clock className="h-3 w-3" />Under Review</span>;
    }
  };

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">User Suggestions</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {suggestions.length} total • {pendingCount} pending • {acceptedCount} accepted • {totalVotes} votes
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-amber-600">{pendingCount}</p><p className="text-xs text-muted-foreground">Pending Review</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-green-600">{acceptedCount}</p><p className="text-xs text-muted-foreground">Accepted</p></CardContent></Card>
        <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{totalVotes}</p><p className="text-xs text-muted-foreground">Total Votes</p></CardContent></Card>
      </div>

      {/* Search & Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search suggestions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="votes">Most Votes</SelectItem>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredSuggestions.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 p-12 text-center">
          <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No suggestions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredSuggestions.map((suggestion, index) => (
              <motion.div key={suggestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03 }} layout>
                <Card className={cn('overflow-hidden transition-all', suggestion.status === 'pending' && 'border-amber-500/30')}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">{suggestion.title}</h3>
                          {getStatusBadge(suggestion.status)}
                        </div>
                        <p className="mt-2 text-muted-foreground leading-relaxed">{suggestion.description}</p>
                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5"><User className="h-4 w-4" />{suggestion.user_display_name || 'User'}</div>
                          <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{new Date(suggestion.created_at).toLocaleDateString()}</div>
                          <div className="flex items-center gap-1.5"><ThumbsUp className="h-4 w-4" />{suggestion.votes_count} votes</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center rounded-xl bg-primary/10 px-4 py-3">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                        <span className="mt-1 text-lg font-bold text-primary">{suggestion.votes_count}</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-border pt-4">
                      {suggestion.status === 'pending' && (
                        <Button onClick={() => { setSelectedSuggestion(suggestion); setActionType('accept'); }} className="flex-1 gap-2" variant="default">
                          <Check className="h-4 w-4" />Accept
                        </Button>
                      )}
                      <Button onClick={() => setMessageTarget(suggestion)} className="flex-1 gap-2" variant="outline">
                        <Send className="h-4 w-4" />Private Message
                      </Button>
                      <Button onClick={() => { navigator.clipboard.writeText(`${suggestion.title}\n${suggestion.description}`); toast.success('Copied'); }} variant="outline" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button onClick={() => { setSelectedSuggestion(suggestion); setActionType('reject'); }} variant="outline" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!selectedSuggestion && !!actionType} onOpenChange={() => { setSelectedSuggestion(null); setActionType(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{actionType === 'accept' ? 'Confirm Acceptance' : 'Delete Suggestion'}</AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'accept' 
                ? 'A private thank-you message will be sent to the user (not broadcast).'
                : 'Are you sure you want to delete this suggestion permanently?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAction} className={actionType === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {actionType === 'accept' ? 'Accept' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Message Dialog */}
      <Dialog open={!!messageTarget} onOpenChange={() => setMessageTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Private Message to {messageTarget?.user_display_name || 'User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Title..." value={messageTitle} onChange={e => setMessageTitle(e.target.value)} />
            <Textarea placeholder="Write your private message..." value={messageContent} onChange={e => setMessageContent(e.target.value)} className="min-h-[100px] resize-none" />
            <Button onClick={handleSendMessage} disabled={!messageContent.trim() || isSending} className="w-full gap-2">
              <Send className="h-4 w-4" />{isSending ? 'Sending...' : 'Send Private Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
