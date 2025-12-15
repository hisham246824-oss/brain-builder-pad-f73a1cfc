-- Create vocabulary table for English-Arabic word pairs
CREATE TABLE public.vocabulary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word TEXT NOT NULL,
  meanings TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own vocabulary"
ON public.vocabulary
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vocabulary"
ON public.vocabulary
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vocabulary"
ON public.vocabulary
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vocabulary"
ON public.vocabulary
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_vocabulary_updated_at
BEFORE UPDATE ON public.vocabulary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();