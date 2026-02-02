-- Create table for Pomodoro user preferences
CREATE TABLE public.pomodoro_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  study_color TEXT NOT NULL DEFAULT 'teal',
  short_break_color TEXT NOT NULL DEFAULT 'sky',
  long_break_color TEXT NOT NULL DEFAULT 'green',
  alarm_sound TEXT NOT NULL DEFAULT 'chime',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.pomodoro_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own settings" 
ON public.pomodoro_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" 
ON public.pomodoro_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" 
ON public.pomodoro_settings 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_pomodoro_settings_updated_at
BEFORE UPDATE ON public.pomodoro_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for settings sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.pomodoro_settings;