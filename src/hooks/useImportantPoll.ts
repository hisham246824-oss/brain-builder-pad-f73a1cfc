import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ImportantPoll {
  id: string;
  question: string;
  question_translations: Record<string, string> | null;
}

export function useImportantPoll() {
  const { user } = useAuth();
  const [importantPoll, setImportantPoll] = useState<ImportantPoll | null>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!user) { setShowBar(false); return; }

    const fetchImportant = async () => {
      const { data: polls } = await supabase
        .from('admin_polls')
        .select('id, question, question_translations')
        .eq('is_important', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!polls || polls.length === 0) { setShowBar(false); setImportantPoll(null); return; }

      const poll = polls[0] as any;

      // Check if user has voted on this poll
      const { data: votes } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id)
        .limit(1);

      if (votes && votes.length > 0) {
        setShowBar(false);
        setImportantPoll(null);
        return;
      }

      setImportantPoll(poll);
      setShowBar(true);
    };

    fetchImportant();

    const channel = supabase
      .channel('important_polls_header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_polls' }, () => fetchImportant())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'poll_votes' }, () => fetchImportant())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getTitle = () => {
    if (!importantPoll) return '';
    const title = importantPoll.question || '';
    if (title.length > 30) return title.slice(0, 30) + '…';
    return title;
  };

  const dismiss = () => setShowBar(false);

  return { showBar, importantPoll, getTitle, dismiss };
}
