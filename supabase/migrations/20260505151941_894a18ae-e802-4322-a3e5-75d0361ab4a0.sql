
-- Remove sensitive tables from realtime publication
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['support_tickets','support_messages','user_settings','xp_gifts','todos','page_visits','user_blocks','private_messages']
  LOOP
    BEGIN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- Add UPDATE policy for material_files (owner-scoped)
CREATE POLICY "Users can update their own material files"
ON public.material_files
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy for pomodoro_settings (owner-scoped)
CREATE POLICY "Users can delete their own pomodoro settings"
ON public.pomodoro_settings
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Restrict suggestions UPDATE: prevent users from changing status of their own suggestions
DROP POLICY IF EXISTS "Users can update their own suggestions" ON public.suggestions;

CREATE POLICY "Users can update their own suggestions"
ON public.suggestions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND status = (SELECT status FROM public.suggestions s WHERE s.id = suggestions.id)
);
