import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, BookOpen, Video, TrendingUp, Calendar, GraduationCap, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ActivityData {
  activity_type: string;
  activity_date: string;
  count: number;
}

const Index = () => {
  const { user } = useAuth();

  // Fetch activity data for last 7 days
  const { data: activityData = [] } = useQuery({
    queryKey: ['user-activity', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('user_activity')
        .select('*')
        .eq('user_id', user.id)
        .gte('activity_date', startDate)
        .order('activity_date', { ascending: true });
      if (error) throw error;
      return data as ActivityData[];
    },
    enabled: !!user,
  });

  // Fetch vocabulary count
  const { data: vocabularyCount = 0 } = useQuery({
    queryKey: ['vocabulary-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count, error } = await supabase
        .from('vocabulary')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user,
  });

  // Fetch videos watched
  const { data: videosWatched = 0 } = useQuery({
    queryKey: ['videos-watched', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const startDate = format(subDays(new Date(), 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('user_activity')
        .select('count')
        .eq('user_id', user.id)
        .eq('activity_type', 'video_watched')
        .gte('activity_date', startDate);
      if (error) throw error;
      return data.reduce((sum, item) => sum + (item.count || 0), 0);
    },
    enabled: !!user,
  });

  // Generate chart data for last 7 days
  const chartData = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), 6),
      end: new Date(),
    });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayActivities = activityData.filter((a) => a.activity_date === dateStr);
      
      const wordsAdded = dayActivities.find((a) => a.activity_type === 'word_added')?.count || 0;
      const videosWatched = dayActivities.find((a) => a.activity_type === 'video_watched')?.count || 0;
      const siteUsage = dayActivities.reduce((sum, a) => sum + (a.count || 0), 0);

      return {
        date: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        wordsAdded,
        videosWatched,
        siteUsage: siteUsage || 0,
      };
    });
  }, [activityData]);

  // Calculate totals for the week
  const weeklyStats = useMemo(() => ({
    totalWords: chartData.reduce((sum, d) => sum + d.wordsAdded, 0),
    totalVideos: chartData.reduce((sum, d) => sum + d.videosWatched, 0),
    totalUsage: chartData.reduce((sum, d) => sum + d.siteUsage, 0),
  }), [chartData]);

  // If not logged in, show welcome screen
  if (!user) {
    return (
      <div className="flex flex-col items-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center py-12 md:py-20"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow"
          >
            <GraduationCap className="h-8 w-8 text-primary-foreground" />
          </motion.div>

          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
            Master Your Studies
          </h1>
          <p className="mb-8 max-w-md mx-auto text-lg text-muted-foreground">
            Organize your learning materials, track your progress, and achieve your study goals.
          </p>

          <Link to="/auth">
            <Button size="lg" className="rounded-2xl px-8 py-6 text-base font-semibold shadow-glow">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>

        {/* PWA Install hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            📱 Install this app to your device for offline access
          </p>
        </motion.div>
      </div>
    );
  }

  // Logged in - show progress/statistics
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Your Progress</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Vocabulary</p>
                <p className="text-2xl font-bold text-foreground">{vocabularyCount}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Words This Week</p>
                <p className="text-2xl font-bold text-foreground">{weeklyStats.totalWords}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Video className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Videos Watched</p>
                <p className="text-2xl font-bold text-foreground">{videosWatched}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-bold text-foreground">{Math.round(weeklyStats.totalUsage / 7)}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Site Usage */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-foreground">Daily Site Usage</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="siteUsage" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Words Added */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-5 w-5 text-green-500" />
              <h2 className="font-semibold text-foreground">Words Added</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="date" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="wordsAdded"
                    stroke="#22c55e"
                    strokeWidth={3}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Videos Watched */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm lg:col-span-2"
          >
            <div className="flex items-center gap-2 mb-4">
              <Video className="h-5 w-5 text-blue-500" />
              <h2 className="font-semibold text-foreground">Videos Watched This Week</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="fullDate" className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <YAxis className="text-muted-foreground" tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '12px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Bar dataKey="videosWatched" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Activity Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm mt-6"
        >
          <h2 className="font-semibold text-foreground mb-4">Weekly Summary</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Day</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Site Usage</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Words Added</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">Videos Watched</th>
                </tr>
              </thead>
              <tbody>
                {chartData.map((day, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm text-foreground font-medium">{day.fullDate}</td>
                    <td className="py-3 px-4 text-sm text-foreground text-center">{day.siteUsage}</td>
                    <td className="py-3 px-4 text-sm text-foreground text-center">{day.wordsAdded}</td>
                    <td className="py-3 px-4 text-sm text-foreground text-center">{day.videosWatched}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/50">
                  <td className="py-3 px-4 text-sm font-semibold text-foreground">Total</td>
                  <td className="py-3 px-4 text-sm font-semibold text-foreground text-center">{weeklyStats.totalUsage}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-foreground text-center">{weeklyStats.totalWords}</td>
                  <td className="py-3 px-4 text-sm font-semibold text-foreground text-center">{weeklyStats.totalVideos}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Index;
