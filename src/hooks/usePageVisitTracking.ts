import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';

const PENDING_VISITS_KEY = 'offline_pending_visits';

interface PendingVisit {
  user_id: string;
  page_path: string;
  duration_seconds: number;
  device_type?: string;
  os?: string;
  browser?: string;
  is_impersonation?: boolean;
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Device type
  let device_type = 'computer';
  if (/Mobi|Android.*Mobile|iPhone|iPod/.test(ua)) device_type = 'phone';
  else if (/iPad|Android(?!.*Mobile)|Tablet/.test(ua)) device_type = 'tablet';
  
  // OS
  let os = 'Unknown';
  if (/Windows/.test(ua)) os = 'Windows';
  else if (/Mac OS X/.test(ua)) os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : 'macOS';
  else if (/Android/.test(ua)) os = 'Android';
  else if (/Linux/.test(ua)) os = 'Linux';
  else if (/CrOS/.test(ua)) os = 'Chrome OS';
  
  // Browser
  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge';
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera';
  else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
  else if (/Firefox\//.test(ua)) browser = 'Firefox';
  
  return { device_type, os, browser };
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
  const { isImpersonating } = useAdminImpersonation();
  const location = useLocation();
  const startTimeRef = useRef<number>(Date.now());
  const lastPathRef = useRef<string>(location.pathname);

  // Sync pending visits when coming back online
  useEffect(() => {
    const handleOnline = () => syncPendingVisits();
    window.addEventListener('online', handleOnline);
    
    if (navigator.onLine) syncPendingVisits();
    
    return () => window.removeEventListener('online', handleOnline);
  }, []);

  useEffect(() => {
    if (!user) return;
    if (isImpersonating) return;

    const ignoredPaths = new Set(['/auth', '/']);
    if (ignoredPaths.has(location.pathname)) {
      startTimeRef.current = Date.now();
      lastPathRef.current = location.pathname;
      return;
    }

    const deviceInfo = getDeviceInfo();

    const recordVisit = async (path: string, duration: number) => {
      const visit: PendingVisit = {
        user_id: user.id,
        page_path: path,
        duration_seconds: Math.round(duration / 1000),
        ...deviceInfo,
        is_impersonation: false,
      };

      if (!navigator.onLine) {
        queueVisit(visit);
        return;
      }

      try {
        await supabase.from('page_visits').insert(visit);
      } catch (err) {
        queueVisit(visit);
      }
    };

    // Record visit when path changes
    if (lastPathRef.current !== location.pathname) {
      const duration = Date.now() - startTimeRef.current;
      recordVisit(lastPathRef.current, duration);
      
      startTimeRef.current = Date.now();
      lastPathRef.current = location.pathname;
    }

    // Record visit when user leaves the page
    const handleBeforeUnload = () => {
      const duration = Date.now() - startTimeRef.current;
      const visit: PendingVisit = {
        user_id: user.id,
        page_path: location.pathname,
        duration_seconds: Math.round(duration / 1000),
        ...deviceInfo,
        is_impersonation: false,
      };

      if (!navigator.onLine) {
        queueVisit(visit);
        return;
      }

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
  }, [user, location.pathname, isImpersonating]);
}
