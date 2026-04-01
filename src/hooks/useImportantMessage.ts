import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

interface ImportantMessage {
  id: string;
  title: string | null;
  title_translations: Record<string, string> | null;
  content: string;
  content_translations: Record<string, string> | null;
}

export function useImportantMessage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [importantMessage, setImportantMessage] = useState<ImportantMessage | null>(null);
  const [showBar, setShowBar] = useState(false);

  useEffect(() => {
    if (!user) { setShowBar(false); return; }

    const fetchImportant = async () => {
      // Get important messages
      const { data: msgs } = await supabase
        .from('admin_messages')
        .select('id, title, title_translations, content, content_translations')
        .eq('is_important', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (!msgs || msgs.length === 0) { setShowBar(false); setImportantMessage(null); return; }

      const msg = msgs[0] as any;

      // Check if user has already read this message
      const { data: reads } = await supabase
        .from('message_reads')
        .select('id')
        .eq('message_id', msg.id)
        .eq('user_id', user.id)
        .limit(1);

      if (reads && reads.length > 0) {
        setShowBar(false);
        setImportantMessage(null);
        return;
      }

      setImportantMessage(msg);
      setShowBar(true);
    };

    fetchImportant();

    const channel = supabase
      .channel('important_messages_header')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_messages' }, () => fetchImportant())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reads' }, () => fetchImportant())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const getTitle = () => {
    if (!importantMessage) return '';
    const translations = importantMessage.title_translations as Record<string, string> | null;
    const title = translations?.[language] || importantMessage.title || '';
    if (title.length > 30) return title.slice(0, 30) + '…';
    return title;
  };

  const dismiss = () => setShowBar(false);

  return { showBar, importantMessage, getTitle, dismiss };
}
