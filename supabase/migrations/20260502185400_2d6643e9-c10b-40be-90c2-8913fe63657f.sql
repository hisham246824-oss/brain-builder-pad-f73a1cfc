
-- 1. Poll votes: require auth
DROP POLICY IF EXISTS "Users can view votes" ON public.poll_votes;
DROP POLICY IF EXISTS "Authenticated users can view votes" ON public.poll_votes;
CREATE POLICY "Authenticated users can view votes"
  ON public.poll_votes FOR SELECT
  TO authenticated
  USING (true);

-- 2. Support messages: prevent users forging is_admin=true
DROP POLICY IF EXISTS "Users can send messages in their tickets" ON public.support_messages;
CREATE POLICY "Users can send messages in their tickets"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND is_admin = false
    AND EXISTS (
      SELECT 1 FROM public.support_tickets
      WHERE id = ticket_id AND user_id = auth.uid()
    )
  );

-- 3. Videos storage: enforce folder ownership on INSERT
DROP POLICY IF EXISTS "Users can upload videos" ON storage.objects;
CREATE POLICY "Users can upload videos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'videos'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

-- 4. Realtime channel authorization: scope topics by user
-- Enable RLS on realtime.messages and add owner-scoped policies
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any prior policies we created here (idempotent)
DROP POLICY IF EXISTS "Authenticated users can subscribe to own scoped channels" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated users can broadcast to own scoped channels" ON realtime.messages;

-- Allow authenticated users to SELECT (subscribe) only to:
--   * topics ending with their own user id (e.g. "private_messages:<uid>")
--   * generic public channels we explicitly allow (global_chat, admin_messages, admin_polls, suggestions)
CREATE POLICY "Authenticated users can subscribe to own scoped channels"
  ON realtime.messages
  FOR SELECT
  TO authenticated
  USING (
    (realtime.topic() LIKE '%:' || (auth.uid())::text)
    OR realtime.topic() IN (
      'global_chat',
      'admin_messages',
      'admin_polls',
      'suggestions',
      'leaderboard'
    )
  );

CREATE POLICY "Authenticated users can broadcast to own scoped channels"
  ON realtime.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (realtime.topic() LIKE '%:' || (auth.uid())::text)
    OR realtime.topic() IN (
      'global_chat',
      'admin_messages',
      'admin_polls',
      'suggestions',
      'leaderboard'
    )
  );
