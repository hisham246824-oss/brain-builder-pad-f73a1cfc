import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, UserCheck, UserPlus, Globe, TrendingUp, Monitor, Smartphone, Tablet, Laptop, Crown, Clock, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatisticsPanelProps {
  stats: {
    totalUsers: number;
    activeToday: number;
    mostVisitedPages: { page: string; visits: number }[];
    [key: string]: any;
  } | null;
  isLoading: boolean;
}

const pageNameMap: Record<string, { name: string; icon: string; color: string }> = {
  '/materials': { name: 'Materials', icon: '📚', color: 'hsl(199, 89%, 50%)' },
  '/vocabulary': { name: 'Vocabulary', icon: '📖', color: 'hsl(142, 71%, 45%)' },
  '/flashcards': { name: 'Flashcards', icon: '🃏', color: 'hsl(270, 70%, 55%)' },
  '/pomodoro': { name: 'Pomodoro', icon: '⏱️', color: 'hsl(0, 70%, 55%)' },
  '/table-creator': { name: 'Tables', icon: '📊', color: 'hsl(45, 93%, 50%)' },
  '/messages': { name: 'Messages', icon: '✉️', color: 'hsl(199, 89%, 50%)' },
  '/suggestions': { name: 'Suggestions', icon: '💡', color: 'hsl(25, 95%, 55%)' },
  '/settings': { name: 'Settings', icon: '⚙️', color: 'hsl(230, 70%, 55%)' },
  '/todos': { name: 'To-Do', icon: '✅', color: 'hsl(142, 71%, 45%)' },
  '/support': { name: 'Support', icon: '🛟', color: 'hsl(330, 80%, 60%)' },
  '/leaderboard': { name: 'Leaderboard', icon: '🏆', color: 'hsl(45, 93%, 50%)' },
};

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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-[2rem] bg-secondary" />
        ))}
      </div>
    );
  }

  const newUsersToday = stats?.newUsersToday || 0;
  const mostUsedLanguage = stats?.mostUsedLanguage || 'en';
  const topPages = (stats?.mostVisitedPages || []).filter((p: any) => p.page !== '/').slice(0, 5);
  const topCountries = stats?.topCountries || [];
  const deviceStats = stats?.deviceStats || [];
  const topActiveUsers = stats?.topActiveUsers || [];

  const DEVICE_COLORS = ['hsl(199, 89%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(270, 70%, 55%)', 'hsl(25, 95%, 55%)', 'hsl(330, 80%, 60%)'];
  const totalDeviceCount = deviceStats.reduce((sum: number, d: any) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Dashboard Overview</h2>
        <div className="text-xs text-muted-foreground font-mono">Live • {currentTime.toLocaleTimeString()}</div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Total Users</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground"><LiveCounter value={stats?.totalUsers || 0} /></p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Online Now</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground"><LiveCounter value={stats?.activeToday || 0} /></p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] bg-gradient-to-br from-sky-500/10 to-sky-500/5 border-sky-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-sky-500" />
              <span className="text-sm font-medium text-muted-foreground">New Today</span>
            </div>
            <p className="mt-2 text-3xl font-bold text-foreground"><LiveCounter value={newUsersToday} /></p>
          </CardContent>
        </Card>
        <Card className="rounded-[2rem] bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Top Language</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground uppercase">{mostUsedLanguage}</p>
          </CardContent>
        </Card>
      </div>

      {/* 2 Bar Charts side by side */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Top 5 Pages */}
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-primary" /> Top 5 Pages
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topPages.length > 0 ? (
              <div className="space-y-3">
                {topPages.map((page: any, index: number) => {
                  const info = pageNameMap[page.page] || { name: page.page, icon: '📄', color: 'hsl(var(--primary))' };
                  return (
                    <div key={page.page} className="flex items-center gap-3">
                      <span className="text-lg">{info.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{info.name}</p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(page.visits / (topPages[0]?.visits || 1)) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: info.color }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground">{page.visits}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>

        {/* Top 5 Countries */}
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-5 w-5 text-green-500" /> Top 5 Countries
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCountries.length > 0 ? (
              <div className="space-y-3">
                {topCountries.slice(0, 5).map((c: any, index: number) => {
                  const colors = ['hsl(199, 89%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(25, 95%, 55%)', 'hsl(270, 70%, 55%)', 'hsl(330, 80%, 60%)'];
                  return (
                    <div key={c.country} className="flex items-center gap-3">
                      <span className="text-lg">🌍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{c.country}</p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(c.count / (topCountries[0]?.count || 1)) * 100}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: colors[index % colors.length] }}
                          />
                        </div>
                      </div>
                      <span className="text-xs font-bold text-foreground">{c.count}</span>
                    </div>
                  );
                })}
              </div>
            ) : <p className="text-center text-sm text-muted-foreground">No data yet</p>}
          </CardContent>
        </Card>
      </div>

      {/* Donut + Top Active Users */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Device Donut Chart */}
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-5 w-5 text-sky-500" /> Device Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deviceStats.length > 0 ? (
              <div className="flex flex-col items-center gap-4">
                {/* Simple donut visualization */}
                <div className="relative w-40 h-40">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return deviceStats.map((d: any, i: number) => {
                        const pct = totalDeviceCount > 0 ? (d.count / totalDeviceCount) * 100 : 0;
                        const dash = `${pct} ${100 - pct}`;
                        const el = (
                          <circle
                            key={d.type}
                            cx="18" cy="18" r="15.9155"
                            fill="none"
                            stroke={DEVICE_COLORS[i % DEVICE_COLORS.length]}
                            strokeWidth="3"
                            strokeDasharray={dash}
                            strokeDashoffset={-offset}
                          />
                        );
                        offset += pct;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-3">
                  {deviceStats.map((d: any, i: number) => {
                    const pct = totalDeviceCount > 0 ? Math.round((d.count / totalDeviceCount) * 100) : 0;
                    const icons: Record<string, any> = { Phone: Smartphone, Tablet: Tablet, Computer: Monitor, Laptop: Laptop };
                    const Icon = icons[d.type] || Monitor;
                    return (
                      <div key={d.type} className="flex items-center gap-2 text-xs">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: DEVICE_COLORS[i % DEVICE_COLORS.length] }} />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{d.type}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : <p className="text-center text-sm text-muted-foreground py-8">No data yet</p>}
          </CardContent>
        </Card>

        {/* Top 10 Active Users */}
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Crown className="h-5 w-5 text-yellow-500" /> Top 10 Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topActiveUsers.length > 0 ? (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {topActiveUsers.slice(0, 10).map((u: any, i: number) => (
                  <motion.div
                    key={u.user_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 rounded-[1.25rem] border border-border/50 bg-card/50 px-4 py-3"
                  >
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-white text-xs font-bold shrink-0",
                      i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-muted text-muted-foreground'
                    )}>
                      {i === 0 ? <Crown className="h-4 w-4" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{u.display_name || 'User'}</p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {Math.round(u.total_seconds / 3600)}h
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : <p className="text-center text-sm text-muted-foreground py-8">No data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
