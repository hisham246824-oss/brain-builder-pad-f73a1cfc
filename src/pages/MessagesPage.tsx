import { useEffect, useState } from 'react';
import { MessagesSkeleton } from '@/components/skeletons/MessagesSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Heart, Check, Calendar, BarChart, Sparkles, MessageSquareDashed } from 'lucide-react';
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

const POLL_COLORS = [
  'from-primary to-primary/80',
  'from-blue-500 to-cyan-500',
  'from-purple-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-green-500 to-teal-500',
  'from-rose-500 to-red-500',
];

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
    return <MessagesSkeleton />;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-primary via-primary/90 to-primary/60 shadow-lg shadow-primary/20">
          <Mail className="h-7 w-7 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Messages & Polls</h1>
          <p className="text-sm text-muted-foreground">{messages.length} messages • {polls.length} active polls</p>
        </div>
      </motion.div>

      {/* Active Polls */}
      {polls.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <BarChart className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Active Polls</h2>
          </div>
          {polls.map((poll, index) => (
            <motion.div key={poll.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + index * 0.05 }}>
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-shadow duration-300">
                <div className="h-1.5 w-full bg-gradient-to-r from-primary via-primary/80 to-accent" />
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-semibold text-foreground text-lg leading-snug">{poll.question}</h3>
                    <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                      <Sparkles className="h-3 w-3" />
                      {poll.total_votes} votes
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(poll.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <div className="mt-5 space-y-2.5">
                    {poll.options.map((opt, idx) => {
                      const isSelected = poll.user_vote === idx;
                      const hasVoted = poll.user_vote !== null;
                      const count = poll.vote_counts[idx] || 0;
                      const pct = poll.total_votes > 0 ? (count / poll.total_votes) * 100 : 0;
                      const colorGrad = POLL_COLORS[idx % POLL_COLORS.length];

                      return (
                        <motion.button
                          key={idx}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVote(poll.id, idx)}
                          className={cn(
                            'w-full relative rounded-[1.25rem] border-2 p-4 text-left transition-all text-sm overflow-hidden',
                            isSelected
                              ? 'border-primary bg-primary/5 shadow-sm'
                              : 'border-border/50 hover:border-primary/30 hover:bg-secondary/30'
                          )}
                        >
                          {hasVoted && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.7, ease: 'easeOut' }}
                              className={cn("absolute left-0 top-0 h-full rounded-[1.25rem] bg-gradient-to-r opacity-15", colorGrad)}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
                                isSelected ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                              )}>
                                {isSelected ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + idx)}
                              </div>
                              <span className="font-medium">{opt}</span>
                            </div>
                            {hasVoted && (
                              <span className={cn("text-xs font-semibold", isSelected ? "text-primary" : "text-muted-foreground")}>
                                {Math.round(pct)}%
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Messages */}
      {messages.length === 0 && polls.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardContent className="p-16 text-center">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[2rem] bg-gradient-to-br from-secondary to-secondary/50">
                <MessageSquareDashed className="h-12 w-12 text-muted-foreground/40" />
              </div>
              <p className="mt-6 text-xl font-semibold text-foreground/80">No messages yet</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">Messages and polls from the admin team will appear here</p>
            </CardContent>
          </Card>
        </motion.div>
      ) : messages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Mail className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
          </div>
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div key={message.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + index * 0.04 }} layout>
                <Card className="rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
                  <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-primary to-primary/70 shadow-md shadow-primary/15">
                          <Mail className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{message.title || 'Admin Message'}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                            <Calendar className="h-3 w-3" />
                            {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      {message.isRead && (
                        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                          <Check className="h-3 w-3" /> Read
                        </span>
                      )}
                    </div>
                    <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-secondary/70 to-secondary/30 p-5">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.content}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}>
                        <Button
                          variant={message.isLiked ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => toggleLike(message.id)}
                          className={cn(
                            "gap-2 rounded-[1.25rem] px-5 transition-all",
                            message.isLiked && "shadow-md shadow-primary/20"
                          )}
                        >
                          <Heart className={cn('h-4 w-4 transition-all', message.isLiked && 'fill-current scale-110')} />
                          {message.isLiked ? 'Liked' : 'Like'}
                        </Button>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
