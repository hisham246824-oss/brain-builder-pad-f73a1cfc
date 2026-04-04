import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, ThumbsUp, Check, X, User, Calendar, Send, Trash2,
  Search, Clock, Sparkles, Settings2, ChevronDown, ChevronUp,
  Pin, PinOff, CheckCircle2, XCircle, ChevronRight, Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  is_pinned?: boolean;
  user_avatar_color?: string | null;
  user_avatar_icon?: string | null;
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onAccept: (suggestionId: string, userId: string) => Promise<boolean>;
  onReject: (suggestionId: string) => Promise<boolean>;
  onViewUser?: (userId: string) => void;
}

const AVATAR_COLORS: Record<string, string> = {
  primary: 'hsl(175, 60%, 35%)', blue: 'hsl(220, 70%, 50%)', purple: 'hsl(270, 60%, 55%)',
  pink: 'hsl(330, 70%, 55%)', red: 'hsl(0, 70%, 55%)', orange: 'hsl(25, 80%, 55%)',
  yellow: 'hsl(45, 80%, 50%)', green: 'hsl(145, 60%, 40%)', teal: 'hsl(175, 60%, 35%)',
  indigo: 'hsl(240, 60%, 55%)',
};

const PAGE_CATEGORIES = [
  { value: 'all', label: 'All' },
  { value: 'General', label: 'General' },
  { value: 'Study Materials', label: 'Materials' },
  { value: 'Vocabulary', label: 'Vocabulary' },
  { value: 'Pomodoro', label: 'Pomodoro' },
  { value: 'Messages', label: 'Messages' },
  { value: 'Settings', label: 'Settings' },
  { value: 'Suggestions', label: 'Suggestions' },
];

export function SuggestionsPanel({ suggestions, isLoading, onAccept, onReject, onViewUser }: SuggestionsPanelProps) {
  const { user } = useAuth();
  const [deleteTarget, setDeleteTarget] = useState<Suggestion | null>(null);
  const [messageTarget, setMessageTarget] = useState<Suggestion | null>(null);
  const [messageTitle, setMessageTitle] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('votes');
  const [expandedActions, setExpandedActions] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await onReject(deleteTarget.id);
    setDeleteTarget(null);
  };

  const handleSendMessage = async () => {
    if (!messageTarget || !messageContent.trim() || !user) return;
    setIsSending(true);
    try {
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

  const handleTogglePin = async (suggestion: Suggestion) => {
    const newVal = !suggestion.is_pinned;
    try {
      const { error } = await supabase.from('suggestions').update({ is_pinned: newVal } as any).eq('id', suggestion.id);
      if (error) throw error;
      toast.success(newVal ? 'Suggestion pinned' : 'Suggestion unpinned');
    } catch {
      toast.error('Failed to update suggestion');
    }
    setExpandedActions(null);
  };

  const handleAcceptToggle = async (suggestion: Suggestion) => {
    if (suggestion.status === 'accepted') {
      // Undo acceptance
      try {
        const { error } = await supabase.from('suggestions').update({ status: 'pending' }).eq('id', suggestion.id);
        if (error) throw error;
        toast.success('Acceptance undone');
      } catch {
        toast.error('Failed to update');
      }
    } else {
      await onAccept(suggestion.id, suggestion.user_id);
    }
    setExpandedActions(null);
  };

  const getPageCategory = (description: string) => {
    const match = description.match(/^\[([^\]]+)\]/);
    return match?.[1] || null;
  };

  let filteredSuggestions = suggestions.filter(s => {
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.user_display_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    const category = getPageCategory(s.description);
    const matchCategory = filterCategory === 'all' || category === filterCategory;
    return matchSearch && matchStatus && matchCategory;
  });

  filteredSuggestions = [...filteredSuggestions].sort((a, b) => {
    // Pinned first
    const aPinned = (a.is_pinned ? 1 : 0);
    const bPinned = (b.is_pinned ? 1 : 0);
    if (aPinned !== bPinned) return bPinned - aPinned;
    if (sortBy === 'votes') return b.votes_count - a.votes_count;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    return 0;
  });

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;
  const acceptedCount = suggestions.filter(s => s.status === 'accepted').length;
  const totalVotes = suggestions.reduce((sum, s) => sum + s.votes_count, 0);

  const getAvatarColor = (color: string | null) => AVATAR_COLORS[color || 'primary'] || AVATAR_COLORS.primary;

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-3xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">User Suggestions</h2>
          <p className="text-sm text-muted-foreground">
            {suggestions.length} total • {pendingCount} pending • {acceptedCount} accepted
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Pending', value: pendingCount, color: 'amber', icon: Clock },
          { label: 'Accepted', value: acceptedCount, color: 'green', icon: CheckCircle2 },
          { label: 'Total Votes', value: totalVotes, color: 'primary', icon: ThumbsUp },
        ].map(stat => (
          <Card key={stat.label} className="rounded-3xl overflow-hidden border-none shadow-sm">
            <div className={`h-1 w-full bg-gradient-to-r from-${stat.color}-500 to-${stat.color}-400`} />
            <CardContent className="p-4 text-center">
              <stat.icon className={`h-5 w-5 mx-auto mb-1 text-${stat.color}-500`} />
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search, Category & Filters */}
      <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
        <CardContent className="p-3 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search suggestions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-2xl border-none bg-secondary/50" />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[130px] rounded-2xl border-none bg-secondary/50">
              <Filter className="h-3.5 w-3.5 mr-1.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              {PAGE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] rounded-2xl border-none bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[130px] rounded-2xl border-none bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="votes">Most Votes</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {filteredSuggestions.length === 0 ? (
        <Card className="rounded-3xl border-none shadow-sm">
          <CardContent className="p-12 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <Lightbulb className="h-10 w-10 text-muted-foreground" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">No suggestions found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredSuggestions.map((suggestion, index) => {
              const isActionsOpen = expandedActions === suggestion.id;
              const isPinned = suggestion.is_pinned;
              const isAccepted = suggestion.status === 'accepted';
              const pageTag = getPageCategory(suggestion.description);
              const cleanDesc = suggestion.description.replace(/^\[[^\]]+\]\s*/, '');

              return (
                <motion.div key={suggestion.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03 }} layout>
                  <Card className={cn(
                    'rounded-3xl overflow-hidden transition-all hover:shadow-lg border-none shadow-sm',
                    isPinned && 'ring-1 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent',
                    isAccepted && 'ring-1 ring-green-500/20'
                  )}>
                    <div className={cn(
                      "h-1 w-full",
                      isAccepted ? "bg-gradient-to-r from-green-500 to-green-400" :
                      suggestion.status === 'pending' ? "bg-gradient-to-r from-amber-500 to-orange-400" :
                      "bg-gradient-to-r from-muted to-transparent"
                    )} />
                    <CardContent className="p-5">
                      {/* Publisher profile */}
                      <button
                        onClick={() => onViewUser?.(suggestion.user_id)}
                        className="flex items-center gap-2.5 mb-3 hover:opacity-80 transition-opacity"
                      >
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: getAvatarColor(suggestion.user_avatar_color || null) }}
                        >
                          {suggestion.user_display_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-foreground">{suggestion.user_display_name || 'User'}</p>
                          <p className="text-[10px] text-muted-foreground">{suggestion.user_email || ''}</p>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground ml-1" />
                      </button>

                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPinned && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                <Pin className="h-3 w-3" /> Pinned
                              </span>
                            )}
                            {isAccepted && (
                              <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600">
                                <CheckCircle2 className="h-3 w-3" /> Accepted
                              </span>
                            )}
                            {pageTag && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">{pageTag}</span>
                            )}
                            <h3 className="font-semibold text-foreground text-lg">{suggestion.title}</h3>
                          </div>
                          <div className="mt-3 p-4 rounded-2xl bg-secondary/50">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{cleanDesc}</p>
                          </div>
                          <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5 rounded-full bg-secondary/80 px-3 py-1">
                              <Calendar className="h-3.5 w-3.5" />{new Date(suggestion.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 px-5 py-4 border border-primary/10">
                            <ThumbsUp className="h-5 w-5 text-primary" />
                            <span className="mt-1 text-2xl font-bold text-primary">{suggestion.votes_count}</span>
                            <span className="text-[10px] text-muted-foreground">votes</span>
                          </div>
                        </div>
                      </div>

                      {/* Turquoise Actions Button */}
                      <div className="mt-4 flex justify-end">
                        <Button
                          onClick={() => setExpandedActions(isActionsOpen ? null : suggestion.id)}
                          className="gap-2 rounded-full px-5 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                          size="sm"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Suggestion Actions
                          {isActionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </div>

                      {/* Expanded Actions Panel */}
                      <AnimatePresence>
                        {isActionsOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="overflow-hidden"
                          >
                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-teal-500/5 to-secondary/30 border border-teal-500/10 space-y-2">
                              {/* Pin */}
                              <button onClick={() => handleTogglePin(suggestion)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", isPinned ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground")}>
                                  {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{isPinned ? 'Unpin Suggestion' : 'Pin Suggestion'}</p>
                                  <p className="text-[11px] text-muted-foreground">{isPinned ? 'Remove from top' : 'Pin to top for all users'}</p>
                                </div>
                              </button>

                              {/* Accept / Undo */}
                              <button onClick={() => handleAcceptToggle(suggestion)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", isAccepted ? "bg-amber-500/15 text-amber-600" : "bg-green-500/10 text-green-600")}>
                                  {isAccepted ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{isAccepted ? 'Undo Acceptance' : 'Accept Suggestion'}</p>
                                  <p className="text-[11px] text-muted-foreground">{isAccepted ? 'Revert to pending status' : 'Accept and notify the user'}</p>
                                </div>
                              </button>

                              {/* Private Message */}
                              <button onClick={() => { setMessageTarget(suggestion); setExpandedActions(null); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                                  <Send className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">Send Private Message</p>
                                  <p className="text-[11px] text-muted-foreground">Message the suggestion creator directly</p>
                                </div>
                              </button>

                              {/* Delete */}
                              <button onClick={() => { setDeleteTarget(suggestion); setExpandedActions(null); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-destructive/10 transition-all text-left group">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                                  <Trash2 className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-destructive">Delete Suggestion</p>
                                  <p className="text-[11px] text-muted-foreground">Permanently remove this suggestion</p>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Suggestion</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete this suggestion permanently?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground rounded-2xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Message Dialog */}
      <Dialog open={!!messageTarget} onOpenChange={() => setMessageTarget(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-500/10">
                <Send className="h-4 w-4 text-blue-500" />
              </div>
              Private Message to {messageTarget?.user_display_name || 'User'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input placeholder="Title..." value={messageTitle} onChange={e => setMessageTitle(e.target.value)} className="rounded-2xl" />
            <Textarea placeholder="Write your private message..." value={messageContent} onChange={e => setMessageContent(e.target.value)} className="min-h-[100px] resize-none rounded-2xl" />
            <div className="flex justify-end">
              <Button onClick={handleSendMessage} disabled={!messageContent.trim() || isSending} className="gap-2 rounded-2xl">
                <Send className="h-4 w-4" />{isSending ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
