
-- XP Gifts table for admin gifting experience points
CREATE TABLE public.xp_gifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  gifted_by UUID NOT NULL,
  title TEXT NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  message TEXT,
  claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.xp_gifts ENABLE ROW LEVEL SECURITY;

-- Users can view their own gifts
CREATE POLICY "Users can view their own gifts" ON public.xp_gifts
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can update (claim) their own gifts
CREATE POLICY "Users can claim their own gifts" ON public.xp_gifts
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Admins can manage all gifts
CREATE POLICY "Admins can manage gifts" ON public.xp_gifts
  FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- Add is_pinned to suggestions
ALTER TABLE public.suggestions ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;

-- Add xp_points to user_settings for tracking total XP
ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS xp_points INTEGER NOT NULL DEFAULT 0;

-- Add is_pinned and is_important to admin_polls
ALTER TABLE public.admin_polls ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.admin_polls ADD COLUMN IF NOT EXISTS is_important BOOLEAN NOT NULL DEFAULT false;

-- Add multi-language support for polls
ALTER TABLE public.admin_polls ADD COLUMN IF NOT EXISTS question_translations JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.admin_polls ADD COLUMN IF NOT EXISTS options_translations JSONB DEFAULT '{}'::jsonb;

-- Enable realtime for xp_gifts
ALTER PUBLICATION supabase_realtime ADD TABLE public.xp_gifts;
