import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Target, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const features = [
  {
    icon: BookOpen,
    title: 'Organize Materials',
    description: 'Keep all your study materials organized in one place',
  },
  {
    icon: Target,
    title: 'Track Progress',
    description: 'Monitor your learning journey with visual progress tracking',
  },
  {
    icon: Zap,
    title: 'Stay Focused',
    description: 'Check off lessons as you complete them to stay motivated',
  },
];

const Index = () => {
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
          <BookOpen className="h-8 w-8 text-primary-foreground" />
        </motion.div>

        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          Master Your Studies
        </h1>
        <p className="mb-8 max-w-md mx-auto text-lg text-muted-foreground">
          Organize your learning materials, track your progress, and achieve your study goals.
        </p>

        <Link to="/materials">
          <Button size="lg" className="rounded-2xl px-8 py-6 text-base font-semibold shadow-glow">
            Get Started
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="grid gap-6 md:grid-cols-3 w-full max-w-3xl"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="rounded-3xl bg-card p-6 shadow-card text-center"
          >
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <feature.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-2 font-semibold text-card-foreground">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {feature.description}
            </p>
          </motion.div>
        ))}
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
};

export default Index;
