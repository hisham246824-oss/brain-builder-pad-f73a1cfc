
ALTER TABLE public.admin_messages
  ADD COLUMN IF NOT EXISTS is_pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_important boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS title_translations jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS content_translations jsonb DEFAULT '{}'::jsonb;
