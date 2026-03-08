import { motion, AnimatePresence } from 'framer-motion';
import { X, Crown, Star, Heart, Zap, Flame, Rocket, Diamond, Trophy, Medal, Clock, BookOpen } from 'lucide-react';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, heart: Heart, zap: Zap, crown: Crown, flame: Flame, rocket: Rocket, diamond: Diamond,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary', red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
  pink: 'bg-pink-500', slate: 'bg-slate-500',
};

function formatHours(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="h-6 w-6 text-yellow-500 drop-shadow-md" />;
  if (rank === 2) return <Crown className="h-5 w-5 text-gray-400 drop-shadow-sm" />;
  if (rank === 3) return <Crown className="h-5 w-5 text-amber-700 drop-shadow-sm" />;
  return <span className="text-sm font-bold text-muted-foreground w-5 text-center">#{rank}</span>;
}

function UserRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const { t } = useLanguage();
  const IconComponent = entry.avatar_icon ? ICON_MAP[entry.avatar_icon] : null;
  const avatarColorClass = COLOR_MAP[entry.avatar_color] || 'bg-primary';
  const letter = entry.display_name?.[0]?.toUpperCase() || 'U';

  const isTop3 = rank <= 3;
  const bgClass = rank === 1
    ? 'bg-gradient-to-r from-yellow-500/10 to-amber-500/5 border-yellow-500/30'
    : rank === 2
    ? 'bg-gradient-to-r from-gray-300/10 to-gray-400/5 border-gray-400/20'
    : rank === 3
    ? 'bg-gradient-to-r from-amber-700/10 to-orange-600/5 border-amber-700/20'
    : 'bg-card/50 border-border/50';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.04 }}
      className={cn(
        'flex items-center gap-3 rounded-[1.2rem] border px-4 py-3 transition-colors',
        bgClass,
        isTop3 && 'shadow-sm'
      )}
    >
      <div className="flex items-center justify-center w-8 shrink-0">
        <RankBadge rank={rank} />
      </div>

      <div className="relative shrink-0">
        <div className={cn(
          'flex items-center justify-center rounded-full text-white text-sm font-medium',
          isTop3 ? 'h-11 w-11' : 'h-9 w-9',
          avatarColorClass
        )}>
          {IconComponent ? <IconComponent className="h-5 w-5" /> : letter}
        </div>
        {rank === 1 && (
          <div className="absolute -top-2 -right-1">
            <Trophy className="h-4 w-4 text-yellow-500" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold truncate', isTop3 ? 'text-sm' : 'text-xs text-foreground/80')}>
          {entry.display_name}
        </p>
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatHours(entry.total_seconds)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {entry.lesson_count} {t('lessons')}
          </span>
        </div>
      </div>

      {isTop3 && (
        <Medal className={cn('h-5 w-5 shrink-0',
          rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-700'
        )} />
      )}
    </motion.div>
  );
}

export function LeaderboardModal({ isOpen, onClose }: LeaderboardModalProps) {
  const { data: entries = [], isLoading } = useLeaderboard();
  const { t, isRTL } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bottom-20 z-[61] w-[340px] sm:w-[380px] max-h-[70vh] bg-background border border-border rounded-[2rem] shadow-2xl flex flex-col overflow-hidden",
              isRTL ? "left-4" : "right-4"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 pb-2 border-b border-border/50">
              <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                <div>
                  <h2 className="font-bold text-base">{t('leaderboard')}</h2>
                  <p className="text-[11px] text-muted-foreground">{t('leaderboardDesc')}</p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-muted transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-7 w-7 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                </div>
              ) : entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">{t('noLeaderboardData')}</p>
                </div>
              ) : (
                entries.map((entry, i) => (
                  <UserRow key={entry.user_id} entry={entry} rank={i + 1} />
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
