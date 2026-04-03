import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface XPDisplayProps {
  xp?: number;
}

export function SyncStatusIndicator({ xp = 0 }: XPDisplayProps) {
  return (
    <div className={cn("flex items-center gap-1.5 text-xs font-semibold text-amber-500 dark:text-amber-400")} title="Experience Points">
      <Sparkles className="h-3.5 w-3.5" />
      <span>{xp} XP</span>
    </div>
  );
}
