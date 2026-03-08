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

    // Fetch user's ticket IDs so we only notify for their tickets
    const loadTicketIds = async () => {
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

    // Listen for new support messages (admin replies)
    const supportChannel = supabase
      .channel('global-support-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_messages' },
        (payload) => {
          if (!initialized.current) return;
          const msg = payload.new as any;
          // Only notify if it's an admin message AND belongs to the user's ticket
          if (msg.is_admin && msg.sender_id !== user.id && userTicketIds.current.has(msg.ticket_id)) {
            toast.message('💬 New reply from Support', {
              description: msg.content.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content,
              duration: 8000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = '/support';
                },
              },
            });
          }
        }
      )
      .subscribe();

    // Listen for new broadcast messages
    const broadcastChannel = supabase
      .channel('global-broadcast-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'admin_messages' },
        (payload) => {
          const msg = payload.new as any;
          if (msg.sender_id !== user.id) {
            toast.message('📢 New Announcement', {
              description: msg.title || (msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content),
              duration: 8000,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = '/messages';
                },
              },
            });
          }
        }
      )
      .subscribe();

    // Listen for new private messages
    const privateChannel = supabase
      .channel('global-private-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'private_messages', filter: `recipient_id=eq.${user.id}` },
        (payload) => {
          const msg = payload.new as any;
          toast.message('✉️ New Private Message', {
            description: msg.title || (msg.content?.length > 80 ? msg.content.slice(0, 80) + '...' : msg.content),
            duration: 8000,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = '/messages';
              },
            },
          });
        }
      )
      .subscribe();

    // Listen for new ticket creation (so we track new ticket IDs)
    const ticketChannel = supabase
      .channel('global-ticket-tracking')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'support_tickets', filter: `user_id=eq.${user.id}` },
        (payload) => {
          userTicketIds.current.add((payload.new as any).id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(supportChannel);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(privateChannel);
      supabase.removeChannel(ticketChannel);
    };
  }, [user]);
}
