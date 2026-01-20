-- Enable realtime for study_materials table
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_materials;

-- Enable realtime for lessons table
ALTER PUBLICATION supabase_realtime ADD TABLE public.lessons;

-- Enable realtime for material_files table
ALTER PUBLICATION supabase_realtime ADD TABLE public.material_files;

-- Enable realtime for vocabulary table (if not already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'vocabulary'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vocabulary;
  END IF;
END $$;