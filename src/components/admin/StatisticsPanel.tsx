import { motion } from 'framer-motion';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Activity,
  TrendingUp,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StatisticsPanelProps {
  stats: {
    totalUsers: number;
    activeToday: number;
    totalMaterials: number;
    totalLessons: number;
    mostVisitedPages: { page: string; visits: number }[];
    longestDurationPages: { page: string; duration: number }[];
  } | null;
  isLoading: boolean;
}

const pageNameMap: Record<string, string> = {
  '/': 'Home',
  '/materials': 'Study Materials',
  '/vocabulary': 'Vocabulary',
  '/flashcards': 'Flashcards',
  '/pomodoro': 'Pomodoro Timer',
  '/table-creator': 'Table Creator',
  '/ai-chat': 'AI Chat',
  '/messages': 'Messages',
};

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`;
  if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
  return `${Math.round(seconds / 3600)} hr`;
}

export function StatisticsPanel({ stats, isLoading }: StatisticsPanelProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 rounded-lg bg-secondary" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Active Today',
      value: stats?.activeToday || 0,
      icon: Activity,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Study Materials',
      value: stats?.totalMaterials || 0,
      icon: BookOpen,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Lessons',
      value: stats?.totalLessons || 0,
      icon: GraduationCap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        General Statistics
      </motion.h2>

      {/* Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold text-foreground">
                      {stat.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Visited Pages */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Most Visited Pages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.mostVisitedPages && stats.mostVisitedPages.length > 0 ? (
                <div className="space-y-4">
                  {stats.mostVisitedPages.map((page, index) => (
                    <div key={page.page} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {pageNameMap[page.page] || page.page}
                        </p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-primary transition-all"
                            style={{
                              width: `${(page.visits / (stats.mostVisitedPages[0]?.visits || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {page.visits} visits
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Longest Duration Pages */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Longest Session Duration
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.longestDurationPages && stats.longestDurationPages.length > 0 ? (
                <div className="space-y-4">
                  {stats.longestDurationPages.map((page, index) => (
                    <div key={page.page} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {pageNameMap[page.page] || page.page}
                        </p>
                        <div className="mt-1 h-2 overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{
                              width: `${(page.duration / (stats.longestDurationPages[0]?.duration || 1)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDuration(page.duration)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground">No data yet</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
