import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useTheme() {
  const { user } = useAuth();

  useEffect(() => {
    let cancelled = false;

    const applyThemeValue = (theme: string | null | undefined) => {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    };

    const applyTheme = async () => {
      if (!user) {
        const savedTheme = localStorage.getItem('theme');
        applyThemeValue(savedTheme);
        return;
      }

      const cachedSettings = localStorage.getItem('studyhub-user-settings');
      if (cachedSettings) {
        try {
          const parsed = JSON.parse(cachedSettings);
          if (parsed?.user_id === user.id) {
            applyThemeValue(parsed.theme);
          }
        } catch {
          // ignore bad cache
        }
      }

      const { data } = await supabase
        .from('user_settings')
        .select('theme')
        .eq('user_id', user.id)
        .single();

      if (!cancelled) applyThemeValue(data?.theme);
    };

    applyTheme();

    return () => {
      cancelled = true;
    };
  }, [user]);
}
