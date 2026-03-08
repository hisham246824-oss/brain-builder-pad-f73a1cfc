import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, BookOpen, GraduationCap, Activity, TrendingUp, Clock,
  Languages, MessageSquare, Lightbulb, BarChart, ListTodo, Globe,
  Zap, Shield, Ban, Mail, Eye, FileText, CheckCircle2, UserCheck
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
    totalTodos?: number;
    totalPageVisits?: number;
    totalPrivateMessages?: number;
    blockedUsers?: number;
    contentCreatedToday?: number;
    averageSessionDuration?: number;
    mostVisitedPages: { page: string; visits: number }[];
    longestDurationPages: { page: string; duration: number }[];
    recentActivity: { date: string; count: number }[];
    userGrowth: { date: string; count: number }[];
    dailyActiveUsers?: { date: string; count: number }[];
  } | null;
  isLoading: boolean;
}

const pageNameMap: Record<string, string> = {
  '/': 'Home', '/materials': 'Materials', '/vocabulary': 'Vocabulary',
  '/flashcards': 'Flashcards', '/pomodoro': 'Pomodoro',
  '/table-creator': 'Tables', '/ai-chat': 'AI Chat', '/messages': 'Messages',
  '/suggestions': 'Suggestions', '/settings': 'Settings', '/todos': 'To-Do List',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${(seconds / 3600).toFixed(1)}h`;
}

function LiveCounter({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.max(1, Math.floor(value / 30));
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 20);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display.toLocaleString()}</>;
}

export function StatisticsPanel({ stats, isLoading }: StatisticsPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  const totalContent = (stats?.totalMaterials || 0) + (stats?.totalLessons || 0) + (stats?.totalVocabulary || 0) + (stats?.totalTodos || 0);
  const engagementRate = stats?.totalUsers ? Math.round((stats.activeToday / stats.totalUsers) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="text-xs text-muted-foreground font-mono">
          Live • {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Key Stats */}
      <div className="grid gap-3 grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Total Users</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground"><LiveCounter value={stats?.totalUsers || 0} /></p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <UserCheck className="h-5 w-5" />
              <span className="text-sm font-medium">Online Now</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground"><LiveCounter value={stats?.activeToday || 0} /></p>
            <Progress value={engagementRate} className="mt-2 h-1.5" />
            <p className="text-xs text-muted-foreground mt-1">{engagementRate}% of users</p>
          </CardContent>
        </Card>
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
                      <span className="text-xs font-semibold text-foreground">{page.visits.toLocaleString()}</span>
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
              <CardTitle className="flex items-center gap-2 text-base"><Clock className="h-5 w-5 text-primary" />Time Spent by Page</CardTitle>
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
                      <span className="text-xs font-semibold text-foreground">{formatDuration(page.duration)}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-center text-sm text-muted-foreground">No data yet</p>}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Platform Health */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-5 w-5 text-primary" />Platform Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
              {[
                { label: 'User Retention', value: stats?.totalUsers ? Math.min(Math.round((stats.activeToday / stats.totalUsers) * 100), 100) : 0, suffix: '%' },
                { label: 'Content per User', value: stats?.totalUsers ? (totalContent / stats.totalUsers).toFixed(1) : '0', suffix: '' },
                { label: 'Avg Vocabulary', value: stats?.totalUsers ? Math.round((stats?.totalVocabulary || 0) / stats.totalUsers) : 0, suffix: ' words' },
                { label: 'Suggestions Rate', value: stats?.totalUsers ? ((stats?.totalSuggestions || 0) / stats.totalUsers).toFixed(1) : '0', suffix: '/user' },
              ].map((item, i) => (
                <div key={item.label} className="text-center">
                  <p className="text-2xl font-bold text-foreground">{item.value}{item.suffix}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
