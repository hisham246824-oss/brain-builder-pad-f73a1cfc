import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Global real-time listener for admin replies to support tickets
 * and new broadcast messages. Shows toast notifications instantly.
 */
export function useRealtimeNotifications() {
  const { user } = useAuth();
  const userTicketIds = useRef<Set<string>>(new Set());
  const initialized = useRef(false);

  useEffect(() => {
    if (!user) return;

    const isMessagesRoute = window.location.pathname.startsWith('/messages');
    const isSupportRoute = window.location.pathname.startsWith('/support');
    const shouldTrackSupport = isSupportRoute;
    const shouldTrackMessages = isMessagesRoute;

    const loadTicketIds = async () => {
      if (!shouldTrackSupport) {
        initialized.current = true;
        return;
      }
      const { data } = await supabase
        .from('support_tickets')
        .select('id')
        .eq('user_id', user.id);
      if (data) {
        userTicketIds.current = new Set(data.map(t => t.id));
      }
      initialized.current = true;
    };
    loadTicketIds();

    const channels = [] as ReturnType<typeof supabase.channel>[];

    if (shouldTrackSupport) {
      channels.push(
        supabase
          .channel(`support-notifications-${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'support_messages' },
            (payload) => {
              if (!initialized.current) return;
              const msg = payload.new as any;
              if (msg.is_admin && msg.sender_id !== user.id && userTicketIds.current.has(msg.ticket_id)) {
                toast.message('New reply from Support', {
                  description: msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content,
                  duration: 5000,
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
            (payload) => {
              userTicketIds.current.add((payload.new as any).id);
            }
          )
          .subscribe()
      );
    }

    if (shouldTrackMessages) {
      channels.push(
        supabase
          .channel(`message-notifications-${user.id}`)
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'admin_messages' },
            (payload) => {
              const msg = payload.new as any;
              if (msg.sender_id !== user.id) {
                toast.message('New Announcement', {
                  description: msg.title || (msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content),
                  duration: 5000,
                });
              }
            }
          )
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `recipient_id=eq.${user.id}` },
            (payload) => {
              const msg = payload.new as any;
              toast.message('New Private Message', {
                description: msg.title || (msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content),
                duration: 5000,
              });
            }
          )
          .subscribe()
      );
    }

    return () => {
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [user]);
}
