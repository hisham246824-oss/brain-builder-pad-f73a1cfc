import { motion } from 'framer-motion';
import { 
  Users, BookOpen, GraduationCap, Activity, TrendingUp, Clock,
  Languages, MessageSquare, Lightbulb, BarChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsPanelProps {
  stats: {
    totalUsers: number;
    activeToday: number;
    totalMaterials: number;
    totalLessons: number;
    totalVocabulary: number;
    totalSuggestions: number;
    totalMessages: number;
    totalPolls: number;
    mostVisitedPages: { page: string; visits: number }[];
    longestDurationPages: { page: string; duration: number }[];
    recentActivity: { date: string; count: number }[];
    userGrowth: { date: string; count: number }[];
  } | null;
  isLoading: boolean;
}

const pageNameMap: Record<string, string> = {
  '/': 'Home', '/materials': 'Materials', '/vocabulary': 'Vocabulary',
  '/flashcards': 'Flashcards', '/pomodoro': 'Pomodoro',
  '/table-creator': 'Tables', '/ai-chat': 'AI Chat', '/messages': 'Messages',
  '/suggestions': 'Suggestions', '/settings': 'Settings',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

export function StatisticsPanel({ stats, isLoading }: StatisticsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats?.totalUsers || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { title: 'Active Today', value: stats?.activeToday || 0, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
    { title: 'Materials', value: stats?.totalMaterials || 0, icon: BookOpen, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { title: 'Lessons', value: stats?.totalLessons || 0, icon: GraduationCap, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { title: 'Vocabulary', value: stats?.totalVocabulary || 0, icon: Languages, color: 'text-teal-500', bg: 'bg-teal-500/10' },
    { title: 'Suggestions', value: stats?.totalSuggestions || 0, icon: Lightbulb, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { title: 'Messages', value: stats?.totalMessages || 0, icon: MessageSquare, color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { title: 'Polls', value: stats?.totalPolls || 0, icon: BarChart, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.title}</p>
                    <p className="mt-0.5 text-2xl font-bold text-foreground">{stat.value.toLocaleString()}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* User Growth */}
      {stats?.userGrowth && stats.userGrowth.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-5 w-5 text-primary" /> User Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-1 h-32">
                {stats.userGrowth.map((point, i) => {
                  const max = Math.max(...stats.userGrowth.map(p => p.count));
                  const height = max > 0 ? (point.count / max) * 100 : 0;
                  return (
                    <div key={point.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{point.count}</span>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.max(height, 4)}%` }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className="w-full rounded-t bg-primary/80 min-h-[2px]"
                      />
                      <span className="text-[9px] text-muted-foreground truncate w-full text-center">
                        {point.date.slice(5)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-5 w-5 text-primary" />Most Visited Pages</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.mostVisitedPages && stats.mostVisitedPages.length > 0 ? (
                <div className="space-y-3">
                  {stats.mostVisitedPages.map((page, index) => (
                    <div key={page.page} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{pageNameMap[page.page] || page.page}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(page.visits / (stats.mostVisitedPages[0]?.visits || 1)) * 100}%` }} transition={{ duration: 0.5, delay: index * 0.1 }} className="h-full rounded-full bg-primary" />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{page.visits}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-muted-foreground">No data yet</p>}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.45 }}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-5 w-5 text-primary" />Session Duration</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.longestDurationPages && stats.longestDurationPages.length > 0 ? (
                <div className="space-y-3">
                  {stats.longestDurationPages.map((page, index) => (
                    <div key={page.page} className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{index + 1}</div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{pageNameMap[page.page] || page.page}</p>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${(page.duration / (stats.longestDurationPages[0]?.duration || 1)) * 100}%` }} transition={{ duration: 0.5, delay: index * 0.1 }} className="h-full rounded-full bg-accent-foreground/30" />
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{formatDuration(page.duration)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-muted-foreground">No data yet</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
