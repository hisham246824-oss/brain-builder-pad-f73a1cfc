import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Plus, Trash2, ToggleLeft, ToggleRight, X, Calendar,
  Search, Copy, Share2, Users, TrendingUp, CheckCircle2,
  ArrowUpDown, Sparkles, Vote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AdminPoll {
  id: string;
  sender_id: string | null;
  question: string;
  options: string[];
  created_at: string;
  is_active: boolean;
  votes: { option_index: number; count: number }[];
  total_votes: number;
}

interface PollsPanelProps {
  polls: AdminPoll[];
  isLoading: boolean;
  onCreatePoll: (question: string, options: string[]) => Promise<boolean>;
  onDeletePoll: (id: string) => Promise<boolean>;
  onTogglePoll: (id: string, active: boolean) => Promise<boolean>;
}

const OPTION_COLORS = [
  'bg-primary', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500', 'bg-pink-500'
];

export function PollsPanel({ polls, isLoading, onCreatePoll, onDeletePoll, onTogglePoll }: PollsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setIsCreating(true);
    const success = await onCreatePoll(question, validOptions);
    if (success) {
      setQuestion('');
      setOptions(['', '']);
      setShowCreate(false);
      toast.success('Poll created and live for all users!', { icon: '📊' });
    }
    setIsCreating(false);
  };

  const handleDuplicate = (poll: AdminPoll) => {
    setQuestion(poll.question);
    setOptions([...poll.options, '']);
    setShowCreate(true);
    toast.success('Poll duplicated — edit and create');
  };

  const handleCopyResults = (poll: AdminPoll) => {
    const results = poll.options.map((opt, i) => {
      const count = poll.votes.find(v => v.option_index === i)?.count || 0;
      const pct = poll.total_votes > 0 ? Math.round((count / poll.total_votes) * 100) : 0;
      return `${opt}: ${count} votes (${pct}%)`;
    }).join('\n');
    navigator.clipboard.writeText(`${poll.question}\n\n${results}\n\nTotal votes: ${poll.total_votes}`);
    toast.success('Results copied to clipboard');
  };

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => { const o = [...options]; o[i] = val; setOptions(o); };

  let filteredPolls = polls.filter(p => {
    const matchSearch = p.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus === 'all' || (filterStatus === 'active' ? p.is_active : !p.is_active);
    return matchSearch && matchStatus;
  });

  filteredPolls = [...filteredPolls].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortBy === 'votes') return b.total_votes - a.total_votes;
    return 0;
  });

  const totalVotesAll = polls.reduce((sum, p) => sum + p.total_votes, 0);
  const activePolls = polls.filter(p => p.is_active).length;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 animate-pulse rounded-3xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Poll Center</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {polls.length} poll{polls.length !== 1 ? 's' : ''} • {activePolls} active • {totalVotesAll} total votes
          </p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2 rounded-2xl">
          <Plus className="h-4 w-4" /> New Poll
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-3 grid-cols-3">
        <Card className="rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{polls.length}</p>
            <p className="text-xs text-muted-foreground">Total Polls</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{activePolls}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="rounded-3xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalVotesAll}</p>
            <p className="text-xs text-muted-foreground">Total Votes</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <Card className="rounded-3xl overflow-hidden border-none shadow-sm">
        <CardContent className="p-3 flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search polls..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 rounded-2xl border-none bg-secondary/50"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[110px] rounded-2xl border-none bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[120px] rounded-2xl border-none bg-secondary/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl">
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="votes">Most Votes</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Create Poll */}
      <AnimatePresence>
        {showCreate && (
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
                  Create New Poll
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  placeholder="Ask your question..."
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  className="rounded-2xl text-base"
                />
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex gap-2 items-center"
                    >
                      <div className={cn("h-3 w-3 rounded-full flex-shrink-0", OPTION_COLORS[i] || 'bg-muted')} />
                      <Input
                        placeholder={`Option ${i + 1}`}
                        value={opt}
                        onChange={e => updateOption(i, e.target.value)}
                        className="rounded-2xl"
                      />
                      {options.length > 2 && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl flex-shrink-0" onClick={() => removeOption(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                  {options.length < 6 && (
                    <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5 rounded-2xl mt-1">
                      <Plus className="h-3.5 w-3.5" /> Add Option
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">{options.filter(o => o.trim()).length} of {options.length} options filled</p>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowCreate(false)} className="rounded-2xl">
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || isCreating}
                      className="gap-2 rounded-2xl"
                    >
                      <BarChart className="h-4 w-4" />
                      {isCreating ? 'Creating...' : 'Create Poll'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polls List */}
      {filteredPolls.length === 0 ? (
        <div className="rounded-3xl bg-secondary/50 p-16 text-center">
          <div className="mx-auto h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <BarChart className="h-10 w-10 text-primary" />
          </div>
          <p className="text-lg font-medium text-foreground">No polls yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first poll to gather user feedback</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPolls.map((poll, i) => {
            const winnerIdx = poll.votes.length > 0
              ? poll.votes.reduce((max, v) => v.count > (max?.count || 0) ? v : max, poll.votes[0])?.option_index
              : -1;

            return (
              <motion.div
                key={poll.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn(
                  "rounded-3xl overflow-hidden transition-all hover:shadow-lg",
                  !poll.is_active && "opacity-70"
                )}>
                  <CardContent className="p-0">
                    {/* Status accent bar */}
                    <div className={cn(
                      "h-1 w-full",
                      poll.is_active
                        ? "bg-gradient-to-r from-green-500 to-green-400"
                        : "bg-gradient-to-r from-muted to-transparent"
                    )} />

                    <div className="p-5">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={cn(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold',
                              poll.is_active
                                ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                : 'bg-secondary text-muted-foreground border border-border'
                            )}>
                              <span className={cn("h-1.5 w-1.5 rounded-full", poll.is_active ? "bg-green-500 animate-pulse" : "bg-muted-foreground")} />
                              {poll.is_active ? 'Live' : 'Closed'}
                            </span>
                            <h3 className="font-semibold text-foreground">{poll.question}</h3>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(poll.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {poll.total_votes} vote{poll.total_votes !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleDuplicate(poll)} title="Duplicate">
                            <Copy className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => handleCopyResults(poll)} title="Copy Results">
                            <Share2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => onTogglePoll(poll.id, !poll.is_active)}>
                            {poll.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl" onClick={() => setDeleteId(poll.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
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
                                  {isWinner && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                                  {opt}
                                </span>
                                <span className="text-xs text-muted-foreground font-mono">
                                  {voteCount} ({Math.round(pct)}%)
                                </span>
                              </div>
                              <div className="h-3 overflow-hidden rounded-full bg-secondary/80">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.6, delay: idx * 0.1, ease: 'easeOut' }}
                                  className={cn(
                                    "h-full rounded-full transition-colors",
                                    isWinner ? "bg-green-500" : (OPTION_COLORS[idx] || "bg-primary")
                                  )}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer stats */}
                      {poll.total_votes > 0 && (
                        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <TrendingUp className="h-3.5 w-3.5" />
                            Avg {(poll.total_votes / poll.options.length).toFixed(1)} votes/option
                          </span>
                          <span className="font-medium text-foreground">
                            {poll.total_votes} total response{poll.total_votes !== 1 ? 's' : ''}
                          </span>
                        </div>
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
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>
              This poll and all its votes will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) onDeletePoll(deleteId); setDeleteId(null); }}
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
