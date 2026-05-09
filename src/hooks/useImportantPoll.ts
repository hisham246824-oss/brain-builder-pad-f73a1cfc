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
    if (!user) { setShowBar(false); setImportantPoll(null); return; }

    let cancelled = false;

    const fetchImportant = async () => {
      const { data: polls } = await supabase
        .from('admin_polls')
        .select('id, question, question_translations')
        .eq('is_important', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (cancelled) return;
      if (!polls || polls.length === 0) { setShowBar(false); setImportantPoll(null); return; }

      const poll = polls[0] as any;

      const { data: votes } = await supabase
        .from('poll_votes')
        .select('id')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id)
        .limit(1);

      if (cancelled) return;
      if (votes && votes.length > 0) {
        setShowBar(false);
        setImportantPoll(null);
        return;
      }

      setImportantPoll(poll);
      setShowBar(true);
    };

    const schedule = window.setTimeout(fetchImportant, 450);

    return () => {
      cancelled = true;
      window.clearTimeout(schedule);
    };
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
