import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Send, Edit, Trash2, Plus, Calendar, Save, X,
  Search, Pin, PinOff, Copy, Users, Heart, CheckCheck,
  ArrowUpDown, AlertTriangle, Sparkles, Settings2, Eye,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { Language } from '@/contexts/LanguageContext';

const LANGUAGES: { code: Language; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
];

interface AdminMessage {
  id: string;
  title: string | null;
  content: string;
  created_at: string;
  sender_id: string | null;
  is_pinned?: boolean;
  is_important?: boolean;
  title_translations?: Record<string, string>;
  content_translations?: Record<string, string>;
}

interface MessagesPanelProps {
  messages: AdminMessage[];
  isLoading: boolean;
  onSendBroadcast: (title: string, content: string, extra?: { is_pinned?: boolean; is_important?: boolean; title_translations?: Record<string, string>; content_translations?: Record<string, string> }) => Promise<boolean>;
  onUpdateMessage: (id: string, title: string, content: string, extra?: Record<string, any>) => Promise<boolean>;
  onDeleteMessage: (id: string) => Promise<boolean>;
}

interface UserInfo {
  user_id: string;
  display_name: string | null;
  avatar_color: string | null;
  avatar_icon: string | null;
  email?: string;
}

export function MessagesPanel({ messages, isLoading, onSendBroadcast, onUpdateMessage, onDeleteMessage }: MessagesPanelProps) {
  const [showCompose, setShowCompose] = useState(false);
  const [composeLang, setComposeLang] = useState<Language>('en');
  const [titleTranslations, setTitleTranslations] = useState<Record<string, string>>({});
  const [contentTranslations, setContentTranslations] = useState<Record<string, string>>({});
  const [isSending, setIsSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [readCounts, setReadCounts] = useState<Record<string, { reads: number; likes: number; total: number }>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [expandedActions, setExpandedActions] = useState<string | null>(null);
  const [showLikesFor, setShowLikesFor] = useState<string | null>(null);
  const [showViewsFor, setShowViewsFor] = useState<string | null>(null);
  const [likeUsers, setLikeUsers] = useState<UserInfo[]>([]);
  const [viewUsers, setViewUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

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

  const fetchLikeUsers = async (messageId: string) => {
    setLoadingUsers(true);
    try {
      const { data: reads } = await supabase
        .from('message_reads')
        .select('user_id, read_at')
        .eq('message_id', messageId)
        .eq('liked', true)
        .order('read_at', { ascending: true });

      if (!reads) { setLikeUsers([]); return; }

      const userIds = reads.map(r => r.user_id);
      const [settingsRes, emailsRes] = await Promise.all([
        supabase.from('user_settings').select('user_id, display_name, avatar_color, avatar_icon').in('user_id', userIds),
        supabase.functions.invoke('admin-list-users'),
      ]);

      const emailMap: Record<string, string> = {};
      if (emailsRes.data?.users) {
        emailsRes.data.users.forEach((u: { id: string; email: string }) => { emailMap[u.id] = u.email; });
      }

      const users: UserInfo[] = reads.map(r => {
        const settings = settingsRes.data?.find(s => s.user_id === r.user_id);
        return {
          user_id: r.user_id,
          display_name: settings?.display_name || 'User',
          avatar_color: settings?.avatar_color || 'primary',
          avatar_icon: settings?.avatar_icon || null,
          email: emailMap[r.user_id] || '',
        };
      });
      setLikeUsers(users);
    } catch (err) {
      console.error('Error fetching like users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchViewUsers = async (messageId: string) => {
    setLoadingUsers(true);
    try {
      const { data: reads } = await supabase
        .from('message_reads')
        .select('user_id, read_at')
        .eq('message_id', messageId)
        .order('read_at', { ascending: true });

      if (!reads) { setViewUsers([]); return; }

      const userIds = reads.map(r => r.user_id);
      const [settingsRes, emailsRes] = await Promise.all([
        supabase.from('user_settings').select('user_id, display_name, avatar_color, avatar_icon').in('user_id', userIds),
        supabase.functions.invoke('admin-list-users'),
      ]);

      const emailMap: Record<string, string> = {};
      if (emailsRes.data?.users) {
        emailsRes.data.users.forEach((u: { id: string; email: string }) => { emailMap[u.id] = u.email; });
      }

      const users: UserInfo[] = reads.map(r => {
        const settings = settingsRes.data?.find(s => s.user_id === r.user_id);
        return {
          user_id: r.user_id,
          display_name: settings?.display_name || 'User',
          avatar_color: settings?.avatar_color || null,
          avatar_icon: settings?.avatar_icon || null,
          email: emailMap[r.user_id] || '',
        };
      });
      setViewUsers(users);
    } catch (err) {
      console.error('Error fetching view users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSend = async () => {
    // At least English content is required
    const enContent = contentTranslations['en'] || '';
    if (!enContent.trim()) {
      toast.error('English content is required');
      return;
    }
    setIsSending(true);
    const success = await onSendBroadcast(
      titleTranslations['en'] || '',
      enContent,
      { title_translations: titleTranslations, content_translations: contentTranslations }
    );
    if (success) { 
      setTitleTranslations({});
      setContentTranslations({});
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
    setExpandedActions(null);
  };

  const handleTogglePin = async (msg: AdminMessage) => {
    const newVal = !(msg as any).is_pinned;
    await onUpdateMessage(msg.id, msg.title || '', msg.content, { is_pinned: newVal });
    setExpandedActions(null);
  };

  const handleToggleImportant = async (msg: AdminMessage) => {
    const newVal = !(msg as any).is_important;
    // If setting as important, unset all other important messages first
    if (newVal) {
      for (const m of messages) {
        if ((m as any).is_important && m.id !== msg.id) {
          await onUpdateMessage(m.id, m.title || '', m.content, { is_important: false });
        }
      }
    }
    await onUpdateMessage(msg.id, msg.title || '', msg.content, { is_important: newVal });
    setExpandedActions(null);
  };

  let filteredMessages = messages.filter(m =>
    m.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort: pinned first, then by date
  filteredMessages = [...filteredMessages].sort((a, b) => {
    const aPinned = (a as any).is_pinned ? 1 : 0;
    const bPinned = (b as any).is_pinned ? 1 : 0;
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

  const UserListItem = ({ u }: { u: UserInfo }) => (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-2xl hover:bg-secondary/50 transition-colors">
      <Avatar className="h-9 w-9">
        <AvatarFallback className={cn("text-xs font-bold", `bg-primary/20 text-primary`)}>
          {(u.display_name || 'U').charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{u.display_name || 'User'}</p>
        <p className="text-[11px] text-muted-foreground truncate">{u.email || ''}</p>
      </div>
    </div>
  );

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
      <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
        <CardContent className="p-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search messages..." 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              className="pl-9 rounded-2xl border-none bg-secondary/50" 
            />
          </div>
          <Button 
            variant="ghost" 
            onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}
            className="rounded-2xl gap-2 bg-secondary/50 hover:bg-secondary"
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Button>
        </CardContent>
      </Card>

      {/* Compose Card with Language Tabs */}
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
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>Write your message in each language tab. Users will receive the message in their preferred language. <strong>English is required.</strong></span>
                </div>

                {/* Language Tabs */}
                <Tabs value={composeLang} onValueChange={(v) => setComposeLang(v as Language)}>
                  <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1.5 bg-secondary/60 rounded-2xl">
                    {LANGUAGES.map(lang => (
                      <TabsTrigger
                        key={lang.code}
                        value={lang.code}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                          contentTranslations[lang.code] ? "ring-1 ring-green-500/40" : ""
                        )}
                      >
                        <span className="mr-1">{lang.flag}</span>
                        {lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {LANGUAGES.map(lang => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-3 mt-3">
                      <Input
                        placeholder={`Title (${lang.name})${lang.code === 'en' ? '' : ' - optional'}`}
                        value={titleTranslations[lang.code] || ''}
                        onChange={e => setTitleTranslations(prev => ({ ...prev, [lang.code]: e.target.value }))}
                        className="rounded-2xl"
                        dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                      />
                      <Textarea
                        placeholder={`Message content (${lang.name})${lang.code === 'en' ? ' *' : ' - optional'}`}
                        value={contentTranslations[lang.code] || ''}
                        onChange={e => setContentTranslations(prev => ({ ...prev, [lang.code]: e.target.value }))}
                        rows={4}
                        className="rounded-2xl resize-none"
                        dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                      />
                      <p className="text-xs text-muted-foreground">
                        {(contentTranslations[lang.code] || '').length} characters
                      </p>
                    </TabsContent>
                  ))}
                </Tabs>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCompose(false)} className="rounded-2xl">
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSend} 
                    disabled={!(contentTranslations['en'] || '').trim() || isSending} 
                    className="gap-2 rounded-2xl"
                  >
                    <Send className="h-4 w-4" />
                    {isSending ? 'Sending...' : 'Send Now'}
                  </Button>
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
            const isPinned = (msg as any).is_pinned;
            const isImportant = (msg as any).is_important;
            const isActionsOpen = expandedActions === msg.id;

            return (
              <motion.div 
                key={msg.id} 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: i * 0.02 }}
              >
                <Card className={cn(
                  "rounded-3xl overflow-hidden transition-all hover:shadow-lg",
                  isPinned && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
                  isImportant && "border-sky-400/40 bg-gradient-to-br from-sky-500/5 to-transparent"
                )}>
                  <CardContent className="p-0">
                    {/* Accent bar */}
                    <div className={cn(
                      "h-1 w-full",
                      isImportant ? "bg-gradient-to-r from-sky-500 to-sky-400/50" :
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
                                {isImportant && (
                                  <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                                    <AlertCircle className="h-3 w-3" /> Important
                                  </span>
                                )}
                                <h3 className="font-semibold text-foreground truncate">
                                  {msg.title || 'Broadcast Message'}
                                </h3>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(msg.created_at).toLocaleDateString('en-US', { 
                                  month: 'short', day: 'numeric', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit' 
                                })}
                              </div>
                            </div>

                            {/* Message Actions Button */}
                            <Button
                              onClick={() => setExpandedActions(isActionsOpen ? null : msg.id)}
                              className={cn(
                                "gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all",
                                "bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                              )}
                              size="sm"
                            >
                              <Settings2 className="h-3.5 w-3.5" />
                              Message Actions
                              {isActionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            </Button>
                          </div>

                          {/* Message Content */}
                          <div className="mt-4 p-4 rounded-2xl bg-secondary/50">
                            <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                              {msg.content}
                            </p>
                          </div>

                          {/* Stats Bar */}
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
                                  <button
                                    onClick={() => handleTogglePin(msg)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group"
                                  >
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", isPinned ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground group-hover:text-foreground")}>
                                      {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">{isPinned ? 'Unpin Message' : 'Pin Message'}</p>
                                      <p className="text-[11px] text-muted-foreground">{isPinned ? 'Remove from top of inbox' : 'Show at the top of every user\'s inbox'}</p>
                                    </div>
                                  </button>

                                  {/* Very Important */}
                                  <button
                                    onClick={() => handleToggleImportant(msg)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group"
                                  >
                                    <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl transition-colors", isImportant ? "bg-sky-500/15 text-sky-600 dark:text-sky-400" : "bg-secondary text-muted-foreground group-hover:text-foreground")}>
                                      <AlertCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">{isImportant ? 'Remove Important' : 'Very Important Message'}</p>
                                      <p className="text-[11px] text-muted-foreground">{isImportant ? 'Remove the blue notification bar' : 'Show a blue bar in the header until the user reads it'}</p>
                                    </div>
                                  </button>

                                  {/* Edit */}
                                  <button
                                    onClick={() => startEdit(msg)}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group"
                                  >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground group-hover:text-foreground transition-colors">
                                      <Edit className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">Edit Message</p>
                                      <p className="text-[11px] text-muted-foreground">Update the message content instantly</p>
                                    </div>
                                  </button>

                                  {/* Delete */}
                                  <button
                                    onClick={() => { setDeleteId(msg.id); setExpandedActions(null); }}
                                    className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-destructive/10 transition-all text-left group"
                                  >
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive transition-colors">
                                      <Trash2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-destructive">Delete Message</p>
                                      <p className="text-[11px] text-muted-foreground">Permanently remove from all users</p>
                                    </div>
                                  </button>

                                  {/* Likes */}
                                  <div>
                                    <button
                                      onClick={() => {
                                        const isOpen = showLikesFor === msg.id;
                                        setShowLikesFor(isOpen ? null : msg.id);
                                        if (!isOpen) fetchLikeUsers(msg.id);
                                      }}
                                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group"
                                    >
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 transition-colors">
                                        <Heart className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">Likes</p>
                                        <p className="text-[11px] text-muted-foreground">Users who liked this message</p>
                                      </div>
                                      <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-full">{stats?.likes || 0}</span>
                                    </button>
                                    <AnimatePresence>
                                      {showLikesFor === msg.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="ml-13 pl-3 border-l-2 border-red-500/20 mt-1 mb-2">
                                            {loadingUsers ? (
                                              <div className="py-4 text-center text-xs text-muted-foreground">Loading...</div>
                                            ) : likeUsers.length === 0 ? (
                                              <div className="py-4 text-center text-xs text-muted-foreground">No likes yet</div>
                                            ) : (
                                              <ScrollArea className="max-h-[240px]">
                                                <div className="space-y-1">
                                                  {likeUsers.map(u => <UserListItem key={u.user_id} u={u} />)}
                                                </div>
                                              </ScrollArea>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>

                                  {/* Views */}
                                  <div>
                                    <button
                                      onClick={() => {
                                        const isOpen = showViewsFor === msg.id;
                                        setShowViewsFor(isOpen ? null : msg.id);
                                        if (!isOpen) fetchViewUsers(msg.id);
                                      }}
                                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group"
                                    >
                                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10 text-green-500 transition-colors">
                                        <Eye className="h-5 w-5" />
                                      </div>
                                      <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">Views</p>
                                        <p className="text-[11px] text-muted-foreground">Users who have seen this message</p>
                                      </div>
                                      <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-full">{stats?.reads || 0}</span>
                                    </button>
                                    <AnimatePresence>
                                      {showViewsFor === msg.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          exit={{ height: 0, opacity: 0 }}
                                          className="overflow-hidden"
                                        >
                                          <div className="ml-13 pl-3 border-l-2 border-green-500/20 mt-1 mb-2">
                                            {loadingUsers ? (
                                              <div className="py-4 text-center text-xs text-muted-foreground">Loading...</div>
                                            ) : viewUsers.length === 0 ? (
                                              <div className="py-4 text-center text-xs text-muted-foreground">No views yet</div>
                                            ) : (
                                              <ScrollArea className="max-h-[240px]">
                                                <div className="space-y-1">
                                                  {viewUsers.map(u => <UserListItem key={u.user_id} u={u} />)}
                                                </div>
                                              </ScrollArea>
                                            )}
                                          </div>
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
