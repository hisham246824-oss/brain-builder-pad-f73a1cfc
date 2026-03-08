
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['vocabulary','study_materials','lessons','material_files','suggestions','suggestion_votes','admin_messages','support_tickets','support_messages','user_settings'])
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = tbl
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.user_settings ALTER COLUMN sidebar_order SET DEFAULT ARRAY['home', 'materials', 'vocabulary', 'table-creator', 'pomodoro', 'suggestions', 'messages', 'todos'];
