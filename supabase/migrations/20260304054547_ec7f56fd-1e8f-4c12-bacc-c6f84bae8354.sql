
-- Private messages table (admin to specific user, NOT broadcast)
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage private messages" ON public.private_messages
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own received messages" ON public.private_messages
  FOR SELECT USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own received messages" ON public.private_messages
  FOR UPDATE USING (auth.uid() = recipient_id);

-- User blocks table
CREATE TABLE public.user_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  blocked_by UUID NOT NULL,
  reason TEXT,
  blocked_until TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage blocks" ON public.user_blocks
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own blocks" ON public.user_blocks
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;

-- Add indexes
CREATE INDEX idx_private_messages_recipient ON public.private_messages (recipient_id);
CREATE INDEX idx_private_messages_sender ON public.private_messages (sender_id);
