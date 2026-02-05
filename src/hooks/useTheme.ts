import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTheme() {
  const { user } = useAuth();

  useEffect(() => {
    const applyTheme = async () => {
      if (!user) {
        // Check localStorage for theme preference when not logged in
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        return;
      }

      // Fetch user settings and apply theme
      const { data } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (data?.theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    applyTheme();
  }, [user]);
}
