import { useState, useEffect } from 'react';
import { Ban, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockedScreenProps {
  blockedUntil: string;
  reason: string | null;
  isAdmin?: boolean;
  onReturnToAdmin?: () => void;
}

export function BlockedScreen({ blockedUntil, reason, isAdmin, onReturnToAdmin }: BlockedScreenProps) {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const diff = new Date(blockedUntil).getTime() - Date.now();
      if (diff <= 0) {
        window.location.reload();
        return;
      }
      const totalSeconds = Math.floor(diff / 1000);
      setRemaining({
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60,
      });
      const maxMs = 30 * 24 * 60 * 60 * 1000;
      setProgress(Math.max(0, Math.min(100, ((maxMs - diff) / maxMs) * 100)));
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [blockedUntil]);

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 p-8 max-w-md text-center">
        <div className="relative">
          <svg width="300" height="300" viewBox="0 0 300 300" className="drop-shadow-2xl">
            <circle cx="150" cy="150" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="150" cy="150" r={radius} fill="none"
              stroke="hsl(var(--destructive))" strokeWidth="8" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 150 150)" className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Ban className="h-10 w-10 text-destructive mb-2" />
            <div className="text-3xl font-bold text-foreground font-mono tracking-wider">
              {remaining.days > 0 && <span>{remaining.days}d </span>}
              {String(remaining.hours).padStart(2, '0')}:
              {String(remaining.minutes).padStart(2, '0')}:
              {String(remaining.seconds).padStart(2, '0')}
            </div>
            <p className="text-sm text-muted-foreground mt-1">remaining</p>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-destructive">Account Suspended</h1>
          <p className="text-muted-foreground">
            Your account has been temporarily blocked by an administrator.
          </p>
          {reason && (
            <div className="rounded-2xl bg-destructive/5 border border-destructive/20 p-4 mt-4">
              <p className="text-sm font-medium text-destructive mb-1">Reason</p>
              <p className="text-sm text-foreground">{reason}</p>
            </div>
          )}
          {isAdmin && onReturnToAdmin && (
            <Button onClick={onReturnToAdmin} className="mt-4 gap-2" variant="outline">
              <ShieldCheck className="h-4 w-4" /> Return to Admin
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
