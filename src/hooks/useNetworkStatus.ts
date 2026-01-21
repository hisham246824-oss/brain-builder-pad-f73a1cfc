import { useState, useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
    if (wasOffline) {
      toast({
        title: "أنت متصل بالإنترنت",
        description: "جاري مزامنة البيانات...",
      });
    }
    setWasOffline(false);
  }, [wasOffline]);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    setWasOffline(true);
    toast({
      title: "أنت غير متصل بالإنترنت",
      description: "التطبيق يعمل بالبيانات المحفوظة محلياً",
      variant: "destructive",
    });
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
