import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Plus, Trash2, ToggleLeft, ToggleRight, X, Calendar,
  Search, Users, TrendingUp, CheckCircle2, Sparkles, Settings2,
  ChevronDown, ChevronUp, Pin, PinOff, AlertCircle, Eye, Vote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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

const OPTION_COLORS = [
  'bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'
];

interface AdminPoll {
  id: string;
  sender_id: string | null;
  question: string;
  options: string[];
  created_at: string;
  is_active: boolean;
  votes: { option_index: number; count: number }[];
  total_votes: number;
  is_pinned?: boolean;
  is_important?: boolean;
  question_translations?: Record<string, string>;
  options_translations?: Record<string, string[]>;
}

interface UserInfo {
  user_id: string;
  display_name: string | null;
  email?: string;
  vote_index?: number;
}

interface PollsPanelProps {
  polls: AdminPoll[];
  isLoading: boolean;
  onCreatePoll: (question: string, options: string[], extra?: Record<string, any>) => Promise<boolean>;
  onDeletePoll: (id: string) => Promise<boolean>;
  onTogglePoll: (id: string, active: boolean) => Promise<boolean>;
}

export function PollsPanel({ polls, isLoading, onCreatePoll, onDeletePoll, onTogglePoll }: PollsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [composeLang, setComposeLang] = useState<Language>('en');
  const [questionTranslations, setQuestionTranslations] = useState<Record<string, string>>({});
  const [optionsTranslations, setOptionsTranslations] = useState<Record<string, string[]>>({});
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [expandedActions, setExpandedActions] = useState<string | null>(null);
  const [showVotersFor, setShowVotersFor] = useState<string | null>(null);
  const [showViewersFor, setShowViewersFor] = useState<string | null>(null);
  const [voterUsers, setVoterUsers] = useState<UserInfo[]>([]);
  const [viewerUsers, setViewerUsers] = useState<UserInfo[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const handleCreate = async () => {
    const enQuestion = questionTranslations['en'] || '';
    const enOptions = optionsTranslations['en'] || options;
    const validOptions = enOptions.filter(o => o.trim());
    if (!enQuestion.trim() || validOptions.length < 2) return;
    setIsCreating(true);
    const success = await onCreatePoll(enQuestion, validOptions, {
      question_translations: questionTranslations,
      options_translations: optionsTranslations,
    });
    if (success) {
      setQuestionTranslations({});
      setOptionsTranslations({});
      setOptions(['', '']);
      setShowCreate(false);
    }
    setIsCreating(false);
  };

  const handleTogglePin = async (poll: AdminPoll) => {
    const newVal = !poll.is_pinned;
    try {
      const { error } = await supabase.from('admin_polls').update({ is_pinned: newVal } as any).eq('id', poll.id);
      if (error) throw error;
      toast.success(newVal ? 'Poll pinned' : 'Poll unpinned');
    } catch { toast.error('Failed'); }
    setExpandedActions(null);
  };

  const handleToggleImportant = async (poll: AdminPoll) => {
    const newVal = !poll.is_important;
    try {
      // Unset other important polls first
      if (newVal) {
        for (const p of polls) {
          if (p.is_important && p.id !== poll.id) {
            await supabase.from('admin_polls').update({ is_important: false } as any).eq('id', p.id);
          }
        }
      }
      const { error } = await supabase.from('admin_polls').update({ is_important: newVal } as any).eq('id', poll.id);
      if (error) throw error;
      toast.success(newVal ? 'Poll marked as important' : 'Important status removed');
    } catch { toast.error('Failed'); }
    setExpandedActions(null);
  };

  const fetchVoters = async (pollId: string) => {
    setLoadingUsers(true);
    try {
      const { data: votes } = await supabase.from('poll_votes').select('user_id, option_index').eq('poll_id', pollId);
      if (!votes) { setVoterUsers([]); return; }
      const userIds = votes.map(v => v.user_id);
      const [settingsRes, emailsRes] = await Promise.all([
        supabase.from('user_settings').select('user_id, display_name').in('user_id', userIds),
        supabase.functions.invoke('admin-list-users'),
      ]);
      const emailMap: Record<string, string> = {};
      if (emailsRes.data?.users) emailsRes.data.users.forEach((u: any) => { emailMap[u.id] = u.email; });
      setVoterUsers(votes.map(v => ({
        user_id: v.user_id,
        display_name: settingsRes.data?.find(s => s.user_id === v.user_id)?.display_name || 'User',
        email: emailMap[v.user_id] || '',
        vote_index: v.option_index,
      })));
    } catch { setVoterUsers([]); }
    setLoadingUsers(false);
  };

  const currentLangOptions = optionsTranslations[composeLang] || (composeLang === 'en' ? options : ['', '']);
  const updateCurrentOptions = (idx: number, val: string) => {
    if (composeLang === 'en') {
      const o = [...options]; o[idx] = val; setOptions(o);
      setOptionsTranslations(prev => ({ ...prev, en: o }));
    } else {
      const current = [...(optionsTranslations[composeLang] || options.map(() => ''))];
      current[idx] = val;
      setOptionsTranslations(prev => ({ ...prev, [composeLang]: current }));
    }
  };
  const addOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
      // Extend all translations
      setOptionsTranslations(prev => {
        const next = { ...prev };
        for (const lang of Object.keys(next)) {
          next[lang] = [...(next[lang] || []), ''];
        }
        return next;
      });
    }
  };
  const removeOption = (i: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== i));
      setOptionsTranslations(prev => {
        const next = { ...prev };
        for (const lang of Object.keys(next)) {
          next[lang] = (next[lang] || []).filter((_, idx) => idx !== i);
        }
        return next;
      });
    }
  };

  let filteredPolls = polls.filter(p => {
    const matchSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active);
    return matchSearch && matchStatus;
  });

  filteredPolls = [...filteredPolls].sort((a, b) => {
    const aPinned = (a.is_pinned ? 1 : 0);
    const bPinned = (b.is_pinned ? 1 : 0);
    if (aPinned !== bPinned) return bPinned - aPinned;
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'votes') return b.total_votes - a.total_votes;
    return 0;
  });

  const totalVotesAll = polls.reduce((sum, p) => sum + p.total_votes, 0);
  const activePolls = polls.filter(p => p.is_active).length;

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-3xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500">
            <BarChart className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Poll Center</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{polls.length} polls • {activePolls} active • {totalVotesAll} votes</p>
          </div>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2 rounded-2xl"><Plus className="h-4 w-4" /> New Poll</Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Total Polls', value: polls.length, icon: BarChart, color: 'text-primary' },
          { label: 'Active', value: activePolls, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'Total Votes', value: totalVotesAll, icon: Users, color: 'text-blue-500' },
        ].map(s => (
          <Card key={s.label} className="rounded-3xl border-none shadow-sm">
            <CardContent className="p-4 text-center">
              <s.icon className={cn("h-5 w-5 mx-auto mb-1", s.color)} />
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search & Filters */}
      <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
        <CardContent className="p-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search polls..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 rounded-2xl border-none bg-secondary/50" />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[110px] rounded-2xl border-none bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] rounded-2xl border-none bg-secondary/50"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="votes">Most Votes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Create Poll with Language Tabs */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }}>
            <Card className="rounded-3xl border-primary/30 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-primary" />Create New Poll
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={composeLang} onValueChange={(v) => setComposeLang(v as Language)}>
                  <TabsList className="w-full flex flex-wrap gap-1 h-auto p-1.5 bg-secondary/60 rounded-2xl">
                    {LANGUAGES.map(lang => (
                      <TabsTrigger key={lang.code} value={lang.code} className={cn("rounded-full px-3 py-1.5 text-xs font-medium", questionTranslations[lang.code] ? "ring-1 ring-green-500/40" : "")}>
                        <span className="mr-1">{lang.flag}</span>{lang.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {LANGUAGES.map(lang => (
                    <TabsContent key={lang.code} value={lang.code} className="space-y-3 mt-3">
                      <Input
                        placeholder={`Question (${lang.name})${lang.code === 'en' ? ' *' : ''}`}
                        value={questionTranslations[lang.code] || ''}
                        onChange={e => setQuestionTranslations(prev => ({ ...prev, [lang.code]: e.target.value }))}
                        className="rounded-2xl text-base"
                        dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                      />
                      <div className="space-y-2">
                        {(lang.code === 'en' ? options : options.map((_, i) => optionsTranslations[lang.code]?.[i] || '')).map((opt, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <div className={cn("h-3 w-3 rounded-full flex-shrink-0", OPTION_COLORS[i] || 'bg-muted')} />
                            <Input
                              placeholder={`Option ${i + 1} (${lang.name})`}
                              value={lang.code === 'en' ? options[i] : (optionsTranslations[lang.code]?.[i] || '')}
                              onChange={e => updateCurrentOptions(i, e.target.value)}
                              className="rounded-2xl"
                              dir={lang.code === 'ar' ? 'rtl' : 'ltr'}
                            />
                            {lang.code === 'en' && options.length > 2 && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl flex-shrink-0" onClick={() => removeOption(i)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        ))}
                        {lang.code === 'en' && options.length < 6 && (
                          <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5 rounded-2xl mt-1">
                            <Plus className="h-3.5 w-3.5" /> Add Option
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-2xl">Cancel</Button>
                  <Button onClick={handleCreate} disabled={!(questionTranslations['en'] || '').trim() || options.filter(o => o.trim()).length < 2 || isCreating} className="gap-2 rounded-2xl">
                    <BarChart className="h-4 w-4" />{isCreating ? 'Creating...' : 'Create Poll'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polls List */}
      {filteredPolls.length === 0 ? (
        <div className="rounded-3xl bg-secondary/50 p-16 text-center">
          <BarChart className="mx-auto h-10 w-10 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground">No polls yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll, i) => {
            const winnerIdx = poll.votes.length > 0 ? poll.votes.reduce((max, v) => v.count > (max?.count || 0) ? v : max, poll.votes[0])?.option_index : -1;
            const isActionsOpen = expandedActions === poll.id;
            const isPinned = poll.is_pinned;
            const isImportant = poll.is_important;

            return (
              <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                <Card className={cn(
                  "rounded-3xl overflow-hidden transition-all hover:shadow-lg",
                  !poll.is_active && "opacity-70",
                  isPinned && "ring-1 ring-primary/20",
                  isImportant && "ring-1 ring-green-500/20"
                )}>
                  <CardContent className="p-0">
                    <div className={cn("h-1 w-full", isImportant ? "bg-gradient-to-r from-green-500 to-green-400" : poll.is_active ? "bg-gradient-to-r from-green-500 to-green-400" : "bg-gradient-to-r from-muted to-transparent")} />
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {isPinned && <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary"><Pin className="h-3 w-3" /> Pinned</span>}
                            {isImportant && <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-600"><AlertCircle className="h-3 w-3" /> Important</span>}
                            <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold', poll.is_active ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-secondary text-muted-foreground border border-border')}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", poll.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                              {poll.is_active ? 'Live' : 'Closed'}
                            </span>
                            <h3 className="font-semibold text-foreground">{poll.question}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(poll.created_at).toLocaleDateString()}</span>
                            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{poll.total_votes} votes</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => setExpandedActions(isActionsOpen ? null : poll.id)}
                          className="gap-2 rounded-full px-4 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20"
                          size="sm"
                        >
                          <Settings2 className="h-3.5 w-3.5" />
                          Poll Actions
                          {isActionsOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </Button>
                      </div>

                      {/* Results */}
                      <div className="mt-5 space-y-3">
                        {poll.options.map((opt, idx) => {
                          const voteCount = poll.votes.find(v => v.option_index === idx)?.count || 0;
                          const pct = poll.total_votes > 0 ? (voteCount / poll.total_votes) * 100 : 0;
                          const isWinner = idx === winnerIdx && poll.total_votes > 0;
                          return (
                            <div key={idx} className="space-y-1.5">
                              <div className="flex items-center justify-between text-sm">
                                <span className={cn("text-foreground flex items-center gap-1.5", isWinner && "font-semibold")}>
                                  {isWinner && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}{opt}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">{voteCount} ({Math.round(pct)}%)</span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-secondary/80">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.6, delay: idx * 0.1 }} className={cn("h-full rounded-full", isWinner ? "bg-green-500" : (OPTION_COLORS[idx] || "bg-primary"))} />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Expanded Actions */}
                      <AnimatePresence>
                        {isActionsOpen && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-teal-500/5 to-secondary/30 border border-teal-500/10 space-y-2">
                              {/* Pin */}
                              <button onClick={() => handleTogglePin(poll)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isPinned ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground")}>
                                  {isPinned ? <PinOff className="h-5 w-5" /> : <Pin className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{isPinned ? 'Unpin' : 'Pin Poll'}</p>
                                  <p className="text-[11px] text-muted-foreground">Pin to top of polls list</p>
                                </div>
                              </button>

                              {/* Important */}
                              <button onClick={() => handleToggleImportant(poll)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", isImportant ? "bg-green-500/15 text-green-600" : "bg-secondary text-muted-foreground")}>
                                  <AlertCircle className="h-5 w-5" />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{isImportant ? 'Remove Important' : 'Very Important Poll'}</p>
                                  <p className="text-[11px] text-muted-foreground">Show green notification in header</p>
                                </div>
                              </button>

                              {/* Toggle Active */}
                              <button onClick={() => { onTogglePoll(poll.id, !poll.is_active); setExpandedActions(null); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", poll.is_active ? "bg-amber-500/15 text-amber-600" : "bg-green-500/10 text-green-600")}>
                                  {poll.is_active ? <ToggleLeft className="h-5 w-5" /> : <ToggleRight className="h-5 w-5" />}
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{poll.is_active ? 'Deactivate Poll' : 'Activate Poll'}</p>
                                  <p className="text-[11px] text-muted-foreground">{poll.is_active ? 'Hide from public view' : 'Make visible to users'}</p>
                                </div>
                              </button>

                              {/* Who Voted */}
                              <div>
                                <button onClick={() => { const open = showVotersFor === poll.id; setShowVotersFor(open ? null : poll.id); if (!open) fetchVoters(poll.id); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-secondary/60 transition-all text-left group">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500"><Vote className="h-5 w-5" /></div>
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">Who Voted</p>
                                    <p className="text-[11px] text-muted-foreground">See all voters and their choices</p>
                                  </div>
                                  <span className="text-sm font-bold text-foreground bg-secondary px-3 py-1 rounded-full">{poll.total_votes}</span>
                                </button>
                                <AnimatePresence>
                                  {showVotersFor === poll.id && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                      <div className="ml-13 pl-3 border-l-2 border-blue-500/20 mt-1 mb-2">
                                        {loadingUsers ? <p className="py-4 text-center text-xs text-muted-foreground">Loading...</p> : voterUsers.length === 0 ? <p className="py-4 text-center text-xs text-muted-foreground">No voters</p> : (
                                          <ScrollArea className="max-h-[240px]">
                                            <div className="space-y-1">
                                              {voterUsers.map(u => (
                                                <div key={u.user_id} className="flex items-center gap-3 py-2 px-3 rounded-2xl hover:bg-secondary/50">
                                                  <Avatar className="h-8 w-8"><AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">{(u.display_name || 'U').charAt(0)}</AvatarFallback></Avatar>
                                                  <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-foreground truncate">{u.display_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                                                  </div>
                                                  {u.vote_index !== undefined && (
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                                                      Option {u.vote_index + 1}
                                                    </span>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          </ScrollArea>
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>

                              {/* Delete */}
                              <button onClick={() => { setDeleteId(poll.id); setExpandedActions(null); }} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-destructive/10 transition-all text-left group">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive"><Trash2 className="h-5 w-5" /></div>
                                <div>
                                  <p className="text-sm font-semibold text-destructive">Delete Poll</p>
                                  <p className="text-[11px] text-muted-foreground">Permanently delete this poll</p>
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
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
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>This poll and all its votes will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeletePoll(deleteId); setDeleteId(null); }} className="bg-destructive text-destructive-foreground rounded-2xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
