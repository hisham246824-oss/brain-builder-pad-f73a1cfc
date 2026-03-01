
-- Admin polls table
CREATE TABLE public.admin_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

ALTER TABLE public.admin_polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage polls" ON public.admin_polls FOR ALL USING (public.is_admin(auth.uid()));
CREATE POLICY "Everyone can view active polls" ON public.admin_polls FOR SELECT USING (true);

-- Poll votes table
CREATE TABLE public.poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.admin_polls(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  option_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote" ON public.poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view votes" ON public.poll_votes FOR SELECT USING (true);
CREATE POLICY "Users can change their vote" ON public.poll_votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their vote" ON public.poll_votes FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage votes" ON public.poll_votes FOR ALL USING (public.is_admin(auth.uid()));

-- Allow admins to update and delete messages
CREATE POLICY "Admins can update messages" ON public.admin_messages FOR UPDATE USING (public.is_admin(auth.uid()));

-- Enable realtime for polls
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_polls;
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
