import { useEffect, useState } from 'react';
import { MessagesSkeleton } from '@/components/skeletons/MessagesSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Heart, Check, Calendar, BarChart, MessageSquareDashed } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  const { t } = useLanguage();
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
      toast.success(t('thankYouVote'));
      fetchPolls();
    } catch {
      toast.error(t('failedToVote'));
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
          <h1 className="text-2xl font-bold text-foreground tracking-tight">{t('messagesTitle')}</h1>
          <p className="text-sm text-muted-foreground">{messages.length} {t('messages')} • {polls.length} {t('activePolls')}</p>
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
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-lg">
                <CardContent className="p-8">
                  <h3 className="font-bold text-foreground text-xl leading-snug mb-6">{poll.question}</h3>
                  <div className="space-y-3">
                    {poll.options.map((opt, idx) => {
                      const isSelected = poll.user_vote === idx;
                      return (
                        <motion.button
                          key={idx}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleVote(poll.id, idx)}
                          className="w-full flex items-center gap-4 p-3 rounded-2xl text-left transition-all hover:bg-secondary/40"
                        >
                          <div className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40 bg-transparent"
                          )}>
                            {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
                          </div>
                          <span className={cn("text-sm font-medium", isSelected ? "text-primary" : "text-foreground")}>{opt}</span>
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
                <div className="flex items-stretch gap-3">
                  {/* Like button on the left */}
                  <div className="flex items-center">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => toggleLike(message.id)}
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-2xl border-2 transition-all duration-300",
                        message.isLiked
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/15"
                          : "border-border/50 bg-card hover:border-primary/30"
                      )}
                    >
                      <Heart className={cn('h-5 w-5 transition-all', message.isLiked ? 'fill-primary text-primary scale-110' : 'text-muted-foreground')} />
                    </motion.button>
                  </div>
                  {/* Message card */}
                  <Card className="flex-1 rounded-[2rem] overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300">
                    <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-transparent" />
                    <CardContent className="p-6">
                      <h3 className="text-lg font-bold text-foreground tracking-tight">{message.title || 'Admin Message'}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(message.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="mt-4 rounded-[1.5rem] bg-gradient-to-br from-secondary/50 to-secondary/20 p-5 border border-border/30">
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message.content}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
