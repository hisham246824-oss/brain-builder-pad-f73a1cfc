
-- Vocabulary groups table
CREATE TABLE public.vocabulary_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vocabulary_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own groups"
ON public.vocabulary_groups FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own groups"
ON public.vocabulary_groups FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own groups"
ON public.vocabulary_groups FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own groups"
ON public.vocabulary_groups FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_vocabulary_groups_updated_at
BEFORE UPDATE ON public.vocabulary_groups
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to vocabulary
ALTER TABLE public.vocabulary
  ADD COLUMN group_id UUID REFERENCES public.vocabulary_groups(id) ON DELETE SET NULL,
  ADD COLUMN is_difficult BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX idx_vocabulary_group_id ON public.vocabulary(group_id);
CREATE INDEX idx_vocabulary_is_difficult ON public.vocabulary(is_difficult) WHERE is_difficult = true;
