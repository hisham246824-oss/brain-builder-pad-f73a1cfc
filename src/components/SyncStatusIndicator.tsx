import { useState, useEffect } from 'react';
import { Cloud, CloudOff, Loader2 } from 'lucide-react';
import { getSyncStatus, SyncStatus } from '@/lib/offlineCache';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';

export function SyncStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    const handler = (e: Event) => setStatus((e as CustomEvent).detail);
    window.addEventListener('sync-status-change', handler);
    // Also poll periodically
    const interval = setInterval(() => setStatus(getSyncStatus()), 3000);
    return () => {
      window.removeEventListener('sync-status-change', handler);
      clearInterval(interval);
    };
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-destructive" title="Offline">
        <CloudOff className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Offline</span>
      </div>
    );
  }

  if (status === 'syncing') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-primary" title="Syncing...">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span className="hidden sm:inline">Syncing</span>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="flex items-center gap-1.5 text-xs text-amber-500 dark:text-amber-400" title="Pending sync">
        <Cloud className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Pending</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1.5 text-xs text-muted-foreground/50")} title="Synced">
      <Cloud className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Synced</span>
    </div>
  );
}
