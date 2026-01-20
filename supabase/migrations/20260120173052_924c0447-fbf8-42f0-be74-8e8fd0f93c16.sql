-- Add spaced repetition fields to vocabulary table
ALTER TABLE public.vocabulary
ADD COLUMN IF NOT EXISTS ease_factor DECIMAL(3,2) DEFAULT 2.5,
ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS repetitions INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMP WITH TIME ZONE DEFAULT now();