import { motion } from 'framer-motion';
import { Crown, Star, Heart, Zap, Flame, Rocket, Diamond, Trophy, Medal, Clock, BookOpen, Target, Award } from 'lucide-react';
import { useLeaderboard, LeaderboardEntry } from '@/hooks/useLeaderboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
  if (rank === 1) return <Crown className="h-7 w-7 text-yellow-500 drop-shadow-md" />;
  if (rank === 2) return <Crown className="h-6 w-6 text-gray-400 drop-shadow-sm" />;
  if (rank === 3) return <Crown className="h-6 w-6 text-amber-700 drop-shadow-sm" />;
  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground">
      {rank}
    </div>
  );
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
        'flex items-center gap-4 rounded-[1.5rem] border px-5 py-4 transition-colors',
        bgClass,
        isTop3 && 'shadow-sm'
      )}
    >
      <div className="flex items-center justify-center w-10 shrink-0">
        <RankBadge rank={rank} />
      </div>
      <div className="relative shrink-0">
        <div className={cn(
          'flex items-center justify-center rounded-full text-white text-sm font-medium',
          isTop3 ? 'h-12 w-12' : 'h-10 w-10',
          avatarColorClass
        )}>
          {IconComponent ? <IconComponent className="h-5 w-5" /> : letter}
        </div>
        {rank === 1 && (
          <div className="absolute -top-2 -right-1">
            <Trophy className="h-5 w-5 text-yellow-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('font-semibold truncate', isTop3 ? 'text-base' : 'text-sm text-foreground/80')}>
          {entry.display_name}
        </p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatHours(entry.total_seconds)}
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            {entry.lesson_count} {t('lessons')}
          </span>
        </div>
      </div>
      {isTop3 && (
        <Medal className={cn('h-6 w-6 shrink-0',
          rank === 1 ? 'text-yellow-500' : rank === 2 ? 'text-gray-400' : 'text-amber-700'
        )} />
      )}
    </motion.div>
  );
}

export default function LeaderboardPage() {
  const { data: entries = [], isLoading } = useLeaderboard();
  const { t, isRTL } = useLanguage();
  const isMobile = useIsMobile();

  const instructions = [
    { icon: Target, title: t('leaderboardRule1Title'), desc: t('leaderboardRule1Desc') },
    { icon: Award, title: t('leaderboardRule2Title'), desc: t('leaderboardRule2Desc') },
    { icon: Trophy, title: t('leaderboardRule3Title'), desc: t('leaderboardRule3Desc') },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-6xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('leaderboard')}</h1>
        </div>
        <p className="text-muted-foreground">{t('leaderboardDesc')}</p>
      </div>

      <div className={cn("flex gap-8", isMobile ? "flex-col" : isRTL ? "flex-row-reverse" : "flex-row")}>
        {/* Leaderboard list */}
        <div className={cn("flex-1", isMobile ? "w-full" : "w-3/5")}>
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">{t('noLeaderboardData')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((entry, i) => (
                <UserRow key={entry.user_id} entry={entry} rank={i + 1} />
              ))}
            </div>
          )}
        </div>

        {/* Instructions panel */}
        <div className={cn("shrink-0", isMobile ? "w-full" : "w-2/5")}>
          <div className="rounded-[2rem] border border-border bg-card/50 p-6 space-y-5 sticky top-24">
            <h3 className="text-lg font-bold text-foreground">{t('leaderboardHowTo')}</h3>
            {instructions.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
