import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Bot, BookOpen, Timer, CheckSquare, ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { AuthDialog } from '@/components/auth/AuthDialog';

const features = [
  {
    icon: Bot,
    title: 'AI Study Assistant',
    description: 'Chat with an intelligent AI tutor that can summarize, explain, and help you understand any topic with precision.',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconBg: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  },
  {
    icon: BookOpen,
    title: 'Organize Materials',
    description: 'Keep all your courses, lessons, and files perfectly organized in one place with progress tracking.',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  {
    icon: Timer,
    title: 'Pomodoro Timer',
    description: 'Stay focused with customizable study sessions, break intervals, and ambient nature sounds.',
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  },
  {
    icon: CheckSquare,
    title: 'Vocabulary & Flashcards',
    description: 'Build your vocabulary with spaced repetition flashcards and track your memorization progress.',
    gradient: 'from-purple-500/20 to-pink-500/20',
    iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
  },
];

const motivationalPhrases = [
  { text: "Struggling with a difficult subject?", action: "Let AI help you understand it", link: "/ai-chat" },
  { text: "Feeling overwhelmed by too many materials?", action: "Organize them in one place", link: "/materials" },
  { text: "Can't stay focused while studying?", action: "Try the Pomodoro technique", link: "/pomodoro" },
  { text: "Having trouble memorizing new terms?", action: "Use flashcards for better retention", link: "/flashcards" },
  { text: "Need to create study tables quickly?", action: "Use the table creator tool", link: "/table-creator" },
  { text: "Want to track your learning progress?", action: "Check your course completion", link: "/materials" },
  { text: "Looking for a distraction-free study zone?", action: "Enter Focus Mode now", link: "/pomodoro" },
  { text: "Need someone to explain a concept simply?", action: "Ask the AI tutor", link: "/ai-chat" },
  { text: "Want to suggest a new feature?", action: "Share your ideas with us", link: "/suggestions" },
  { text: "Ready to take your studies to the next level?", action: "Explore all tools", link: "/materials" },
];

function AnimatedHomeBackground() {
  const orbs = useMemo(() => [
    { size: 'w-[400px] h-[400px]', position: { left: '-5%', top: '-10%' }, duration: 22, delay: 0 },
    { size: 'w-[350px] h-[350px]', position: { right: '-8%', top: '20%' }, duration: 18, delay: 2 },
    { size: 'w-[300px] h-[300px]', position: { left: '30%', bottom: '-5%' }, duration: 25, delay: 4 },
    { size: 'w-[250px] h-[250px]', position: { right: '20%', bottom: '30%' }, duration: 20, delay: 1 },
  ], []);

  return (
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Rich gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/8 to-primary/5 dark:from-primary/15 dark:via-accent/10 dark:to-primary/8" />
      {/* Secondary gradient sweep */}
      <motion.div 
        className="absolute inset-0"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{ background: 'radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.12) 0%, transparent 60%)' }}
      />
      <motion.div 
        className="absolute inset-0"
        animate={{ opacity: [0.2, 0.5, 0.2] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{ background: 'radial-gradient(ellipse at 70% 80%, hsl(var(--primary) / 0.1) 0%, transparent 50%)' }}
      />
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className={`absolute ${orb.size} rounded-full blur-3xl`}
          style={{ ...orb.position, backgroundColor: 'hsl(var(--primary))', opacity: 0.15 }}
          animate={{
            x: [0, 60, -30, 0],
            y: [0, -50, 30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: orb.delay,
          }}
        />
      ))}
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}

function GuestHomePage() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <div className="flex flex-col items-center pb-12">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center py-16 md:py-24 max-w-3xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-glow"
          >
            <GraduationCap className="h-10 w-10 text-primary-foreground" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl"
          >
            Your Ultimate
            <span className="block text-primary mt-2">Study Companion</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-10 max-w-xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed"
          >
            AI-powered tools, smart organization, and focused study sessions — 
            everything you need to ace your studies, all in one place.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              size="lg"
              onClick={() => setShowAuth(true)}
              className="rounded-full px-10 py-7 text-lg font-semibold shadow-glow hover:shadow-glow transition-all"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </motion.div>

        {/* Features heading */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center mb-10 w-full"
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-primary uppercase tracking-wider">Features</span>
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            Everything You Need to Succeed
          </h2>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="grid gap-5 sm:grid-cols-2 w-full max-w-4xl"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className={`rounded-3xl bg-gradient-to-br ${feature.gradient} border border-border/50 backdrop-blur-sm p-6 md:p-8 shadow-card`}
            >
              <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg}`}>
                <feature.icon className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="mt-16 text-center max-w-lg mx-auto"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            Ready to Transform Your Study Habits?
          </h3>
          <p className="text-muted-foreground mb-8">
            Join students who are already using StudyHub to organize, focus, and succeed in their academic journey.
          </p>
          <Button
            size="lg"
            onClick={() => setShowAuth(true)}
            className="rounded-full px-8 py-6 text-base font-semibold shadow-glow"
          >
            Create Your Free Account
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
      <AuthDialog isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

function LoggedInHomePage() {
  const { settings } = useUserSettings();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % motivationalPhrases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const displayName = settings?.display_name || 'Student';
  const currentPhrase = motivationalPhrases[phraseIndex];

  return (
    <div className="flex flex-col items-center pb-12">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center py-12 md:py-20 max-w-2xl mx-auto"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow"
        >
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl"
        >
          Welcome back, <span className="text-primary">{displayName}!</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8 max-w-lg mx-auto text-base md:text-lg text-muted-foreground leading-relaxed"
        >
          StudyHub is your all-in-one academic toolkit. Organize your course materials, 
          study with AI-powered assistance, stay focused with Pomodoro sessions, 
          and build your vocabulary — all synced across your devices.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link to="/materials">
            <Button size="lg" className="rounded-full px-8 py-6 text-base font-semibold shadow-glow">
              Go to My Materials
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </motion.div>
      </motion.div>

      {/* Quick access grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="grid gap-4 grid-cols-2 md:grid-cols-4 w-full max-w-3xl mb-12"
      >
        {[
          { icon: Bot, label: 'AI Chat', to: '/ai-chat', color: 'text-blue-500' },
          { icon: BookOpen, label: 'Materials', to: '/materials', color: 'text-emerald-500' },
          { icon: Timer, label: 'Pomodoro', to: '/pomodoro', color: 'text-orange-500' },
          { icon: CheckSquare, label: 'Vocabulary', to: '/vocabulary', color: 'text-purple-500' },
        ].map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            whileHover={{ y: -3, transition: { duration: 0.15 } }}
          >
            <Link
              to={item.to}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 shadow-card hover:shadow-soft transition-all"
            >
              <item.icon className={`h-7 w-7 ${item.color}`} />
              <span className="text-sm font-medium text-foreground">{item.label}</span>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Motivational phrase carousel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="w-full max-w-xl"
      >
        <div className="rounded-3xl bg-card border border-border/50 shadow-card p-6 md:p-8 text-center min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle accent */}
          <div className="absolute top-0 left-0 right-0 h-1 gradient-primary opacity-50 rounded-t-3xl" />
          
          <AnimatePresence mode="wait">
            <motion.div
              key={phraseIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-4"
            >
              <p className="text-lg font-medium text-foreground">
                {currentPhrase.text}
              </p>
              <Link to={currentPhrase.link}>
                <Button variant="outline" className="rounded-full px-6 text-sm font-medium">
                  {currentPhrase.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </AnimatePresence>

          {/* Dots indicator */}
          <div className="flex gap-1.5 mt-6">
            {motivationalPhrases.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === phraseIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20'
                }`}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* PWA hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
        className="mt-8 text-sm text-muted-foreground"
      >
        📱 Install this app on your device for offline access
      </motion.p>
    </div>
  );
}

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative">
      <AnimatedHomeBackground />
      {user ? <LoggedInHomePage /> : <GuestHomePage />}
    </div>
  );
};

export default Index;
