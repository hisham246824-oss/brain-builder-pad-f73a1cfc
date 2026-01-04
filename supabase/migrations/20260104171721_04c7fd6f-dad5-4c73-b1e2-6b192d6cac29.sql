-- Create global chat messages table
CREATE TABLE public.global_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.global_chat_messages ENABLE ROW LEVEL SECURITY;

-- Anyone can view messages
CREATE POLICY "Anyone can view chat messages"
ON public.global_chat_messages
FOR SELECT
USING (true);

-- Authenticated users can insert their own messages
CREATE POLICY "Users can insert their own messages"
ON public.global_chat_messages
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.global_chat_messages
FOR DELETE
USING (auth.uid() = user_id);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_chat_messages;

-- Create index for faster queries
CREATE INDEX idx_global_chat_created_at ON public.global_chat_messages(created_at DESC);