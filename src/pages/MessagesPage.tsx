import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Heart, Check, Calendar, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UserPoll {
  id: string;
  question: string;
  options: string[];
  created_at: string;
  is_active: boolean;
  user_vote: number | null;
  vote_counts: Record<number, number>;
  total_votes: number;
}

export default function MessagesPage() {
  const { messages, isLoading, toggleLike, markAllAsRead } = useAdminMessages();
  const { user } = useAuth();
  const [polls, setPolls] = useState<UserPoll[]>([]);
  const [pollsLoading, setPollsLoading] = useState(true);

  const fetchPolls = async () => {
    if (!user) return;
    try {
      const { data: pollsData } = await supabase.from('admin_polls').select('*').eq('is_active', true).order('created_at', { ascending: false });
      const { data: votesData } = await supabase.from('poll_votes').select('poll_id, option_index, user_id');

      const userPolls: UserPoll[] = (pollsData || []).map(poll => {
        const options = Array.isArray(poll.options) ? poll.options as string[] : [];
        const pollVotes = votesData?.filter(v => v.poll_id === poll.id) || [];
        const userVote = pollVotes.find(v => v.user_id === user.id);
        const voteCounts: Record<number, number> = {};
        pollVotes.forEach(v => { voteCounts[v.option_index] = (voteCounts[v.option_index] || 0) + 1; });
        return {
          id: poll.id, question: poll.question, options, created_at: poll.created_at,
          is_active: poll.is_active, user_vote: userVote?.option_index ?? null,
          vote_counts: voteCounts, total_votes: pollVotes.length,
        };
      });
      setPolls(userPolls);
    } catch (err) {
      console.error('Error fetching polls:', err);
    }
    setPollsLoading(false);
  };

  const handleVote = async (pollId: string, optionIndex: number) => {
    if (!user) return;
    const poll = polls.find(p => p.id === pollId);
    if (!poll) return;

    try {
      if (poll.user_vote !== null) {
        // Update existing vote
        await supabase.from('poll_votes').update({ option_index: optionIndex }).eq('poll_id', pollId).eq('user_id', user.id);
      } else {
        await supabase.from('poll_votes').insert({ poll_id: pollId, user_id: user.id, option_index: optionIndex });
      }
      toast.success('Vote recorded!');
      fetchPolls();
    } catch {
      toast.error('Failed to vote');
    }
  };

  useEffect(() => {
    markAllAsRead();
    fetchPolls();

    const channel = supabase
      .channel('poll_votes_user')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchPolls())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (isLoading && pollsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="space-y-4">{[...Array(3)].map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />)}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages & Polls</h1>
          <p className="text-sm text-muted-foreground">{messages.length} messages • {polls.length} active polls</p>
        </div>
      </motion.div>

      {/* Active Polls */}
      {polls.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <BarChart className="h-5 w-5 text-primary" /> Active Polls
          </h2>
          {polls.map((poll, index) => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
              <Card className="overflow-hidden border-primary/20">
                <CardContent className="p-5">
                  <h3 className="font-semibold text-foreground">{poll.question}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(poll.created_at).toLocaleDateString()} • {poll.total_votes} votes
                  </p>
                  <div className="mt-4 space-y-2">
                    {poll.options.map((opt, idx) => {
                      const isSelected = poll.user_vote === idx;
                      const hasVoted = poll.user_vote !== null;
                      const count = poll.vote_counts[idx] || 0;
                      const pct = poll.total_votes > 0 ? (count / poll.total_votes) * 100 : 0;

                      return (
                        <button
                          key={idx}
                          onClick={() => handleVote(poll.id, idx)}
                          className={cn(
                            'w-full relative rounded-xl border p-3 text-left transition-all text-sm',
                            isSelected
                              ? 'border-primary bg-primary/5 text-foreground'
                              : 'border-border hover:border-primary/40 text-foreground'
                          )}
                        >
                          {hasVoted && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.5 }}
                              className="absolute left-0 top-0 h-full rounded-xl bg-primary/10"
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {isSelected && <Check className="h-4 w-4 text-primary" />}
                              <span>{opt}</span>
                            </div>
                            {hasVoted && <span className="text-xs text-muted-foreground">{Math.round(pct)}%</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length === 0 && polls.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="rounded-2xl bg-secondary/50 p-12 text-center">
          <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">No messages</p>
          <p className="mt-1 text-muted-foreground">Messages and polls from admin will appear here</p>
        </motion.div>
      ) : messages.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }} layout>
                <Card className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="absolute left-0 top-0 h-full w-1 gradient-primary" />
                      <div className="p-4 pl-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary">
                              <Mail className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-sm text-foreground">{message.title || 'Admin Message'}</h3>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                          {message.isRead && (
                            <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs text-green-600">
                              <Check className="h-3 w-3" /> Read
                            </span>
                          )}
                        </div>
                        <div className="mt-3 rounded-xl bg-secondary/50 p-3">
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.content}</p>
                        </div>
                        <div className="mt-3">
                          <Button variant={message.isLiked ? 'default' : 'outline'} size="sm" onClick={() => toggleLike(message.id)} className="gap-2">
                            <Heart className={cn('h-4 w-4', message.isLiked && 'fill-current')} />
                            {message.isLiked ? 'Liked' : 'Like'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
