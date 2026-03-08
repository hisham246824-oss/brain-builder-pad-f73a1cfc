import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PENDING_VISITS_KEY = 'offline_pending_visits';

interface PendingVisit {
  user_id: string;
  page_path: string;
  duration_seconds: number;
}

function queueVisit(visit: PendingVisit) {
  try {
    const existing = JSON.parse(localStorage.getItem(PENDING_VISITS_KEY) || '[]');
    existing.push(visit);
    localStorage.setItem(PENDING_VISITS_KEY, JSON.stringify(existing));
  } catch {}
}

async function syncPendingVisits() {
  try {
    const pending: PendingVisit[] = JSON.parse(localStorage.getItem(PENDING_VISITS_KEY) || '[]');
    if (pending.length === 0) return;

    const { error } = await supabase.from('page_visits').insert(pending);
    if (!error) {
      localStorage.removeItem(PENDING_VISITS_KEY);
    }
  } catch (err) {
    console.error('Error syncing pending visits:', err);
  }
}

export function usePageVisitTracking() {
  const { user } = useAuth();
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(location.pathname);

  // Sync pending visits when coming back online
  useEffect(() => {
    const handleOnline = () => syncPendingVisits();
    window.addEventListener('online', handleOnline);
    
    // Also try syncing on mount if online
    if (navigator.onLine) syncPendingVisits();
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!user) return;

    const recordVisit = async (path: string, duration: number) => {
      const visit = {
        user_id: user.id,
        page_path: path,
        duration_seconds: Math.round(duration / 1000),
      };

      if (!navigator.onLine) {
        queueVisit(visit);
        return;
      }

      try {
        await supabase.from('page_visits').insert(visit);
      } catch (err) {
        // If insert fails, queue it
        queueVisit(visit);
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
      const visit = {
        user_id: user.id,
        page_path: location.pathname,
        duration_seconds: Math.round(duration / 1000),
      };

      if (!navigator.onLine) {
        // Queue synchronously for offline
        queueVisit(visit);
        return;
      }

      // Use sendBeacon for reliability on page unload
      const data = JSON.stringify(visit);
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
