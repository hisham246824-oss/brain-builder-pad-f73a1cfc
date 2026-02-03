import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePageVisitTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    if (!user) return;

    const recordVisit = async (path: string, duration: number) => {
      try {
        await supabase.from('page_visits').insert({
          user_id: user.id,
          page_path: path,
          duration_seconds: Math.round(duration / 1000),
        });
      } catch (err) {
        console.error('Error recording page visit:', err);
      }
    };

    // Record visit when path changes
    if (lastPathRef.current !== location.pathname) {
      const duration = Date.now() - startTimeRef.current;
      recordVisit(lastPathRef.current, duration);
      
      // Reset for new page
      startTimeRef.current = Date.now();
      lastPathRef.current = location.pathname;
    }

    // Record visit when user leaves the page
    const handleBeforeUnload = () => {
      const duration = Date.now() - startTimeRef.current;
      // Use sendBeacon for reliability on page unload
      const data = JSON.stringify({
        user_id: user.id,
        page_path: location.pathname,
        duration_seconds: Math.round(duration / 1000),
      });
      
      navigator.sendBeacon(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/page_visits`,
        new Blob([data], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, location.pathname]);
}
