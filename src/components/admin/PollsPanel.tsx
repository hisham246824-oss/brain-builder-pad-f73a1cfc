import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Plus, Trash2, ToggleLeft, ToggleRight, X, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

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

export function PollsPanel({ polls, isLoading, onCreatePoll, onDeletePoll, onTogglePoll }: PollsPanelProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    const validOptions = options.filter(o => o.trim());
    if (!question.trim() || validOptions.length < 2) return;
    setIsCreating(true);
    const success = await onCreatePoll(question, validOptions);
    if (success) { setQuestion(''); setOptions(['', '']); setShowCreate(false); }
    setIsCreating(false);
  };

  const addOption = () => { if (options.length < 6) setOptions([...options, '']); };
  const removeOption = (i: number) => { if (options.length > 2) setOptions(options.filter((_, idx) => idx !== i)); };
  const updateOption = (i: number, val: string) => { const o = [...options]; o[i] = val; setOptions(o); };

  if (isLoading) {
    return <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-40 animate-pulse rounded-xl bg-secondary" />)}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Polls</h2>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2"><Plus className="h-4 w-4" />New Poll</Button>
      </div>

      {/* Create */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Card className="border-primary/30">
              <CardHeader><CardTitle className="text-base">Create Poll</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Input placeholder="Your question..." value={question} onChange={(e) => setQuestion(e.target.value)} />
                <div className="space-y-2">
                  {options.map((opt, i) => (
                    <div key={i} className="flex gap-2">
                      <Input placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => updateOption(i, e.target.value)} />
                      {options.length > 2 && (
                        <Button variant="ghost" size="icon" onClick={() => removeOption(i)}><X className="h-4 w-4" /></Button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <Button variant="outline" size="sm" onClick={addOption} className="gap-1.5"><Plus className="h-3.5 w-3.5" />Add Option</Button>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!question.trim() || options.filter(o => o.trim()).length < 2 || isCreating}>
                    {isCreating ? 'Creating...' : 'Create Poll'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Polls list */}
      {polls.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 p-12 text-center">
          <BarChart className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">No polls created</p>
        </div>
      ) : (
        <div className="space-y-4">
          {polls.map((poll, i) => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={cn(!poll.is_active && 'opacity-70')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-foreground">{poll.question}</h3>
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          poll.is_active ? 'bg-green-500/10 text-green-600' : 'bg-secondary text-muted-foreground'
                        )}>
                          {poll.is_active ? 'Active' : 'Closed'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(poll.created_at).toLocaleDateString()}
                        <span>•</span>
                        <span>{poll.total_votes} votes</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onTogglePoll(poll.id, !poll.is_active)}>
                        {poll.is_active ? <ToggleRight className="h-4 w-4 text-green-500" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteId(poll.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Results */}
                  <div className="mt-4 space-y-2">
                    {poll.options.map((opt, idx) => {
                      const voteCount = poll.votes.find(v => v.option_index === idx)?.count || 0;
                      const pct = poll.total_votes > 0 ? (voteCount / poll.total_votes) * 100 : 0;
                      return (
                        <div key={idx} className="relative">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-foreground">{opt}</span>
                            <span className="text-muted-foreground text-xs">{voteCount} ({Math.round(pct)}%)</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5, delay: idx * 0.1 }}
                              className="h-full rounded-full bg-primary"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll</AlertDialogTitle>
            <AlertDialogDescription>This poll and all its votes will be permanently deleted.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) onDeletePoll(deleteId); setDeleteId(null); }} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
