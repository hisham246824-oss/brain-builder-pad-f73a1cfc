import { useState, useEffect, useCallback } from 'react';
import { getPendingActions, setSyncStatus } from '@/lib/offlineCache';
import { toast } from 'sonner';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      const pending = getPendingActions();
      if (pending.length > 0) {
        setSyncStatus('syncing');
        toast.info('Back online — syncing your offline changes...', { duration: 3000 });
      } else {
        toast.success('You\'re back online!', { duration: 2000 });
      }
    }
    setWasOffline(false);
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast.warning('You are offline — changes will be saved locally', { duration: 4000 });
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return { isOnline, wasOffline };
}
