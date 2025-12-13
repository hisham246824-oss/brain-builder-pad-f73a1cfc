-- Add avatar_url to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add position column to study_materials for ordering
ALTER TABLE public.study_materials ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Add position column to lessons for ordering
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS position integer DEFAULT 0;

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_study_materials_position ON public.study_materials(user_id, position);
CREATE INDEX IF NOT EXISTS idx_lessons_position ON public.lessons(material_id, position);