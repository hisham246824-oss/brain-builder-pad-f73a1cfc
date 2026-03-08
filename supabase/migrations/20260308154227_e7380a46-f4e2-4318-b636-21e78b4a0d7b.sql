
-- Add attachment_url column to support_messages
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS attachment_url text DEFAULT NULL;

-- Allow users to update their own messages (for editing)
CREATE POLICY "Users can update their own messages"
ON public.support_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = sender_id AND is_admin = false);

-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own messages"
ON public.support_messages
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id AND is_admin = false);
