import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Timer, CheckSquare, ArrowRight, GraduationCap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { HomeSkeleton } from '@/components/skeletons/HomeSkeleton';

function GuestHomePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const features = [
    { icon: BookOpen, title: t('organizeMaterials'), description: t('organizeMaterialsDesc'), gradient: 'from-emerald-500/20 to-teal-500/20', iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' },
    { icon: Timer, title: t('pomodoroTimerTitle'), description: t('pomodoroTimerDesc'), gradient: 'from-orange-500/20 to-amber-500/20', iconBg: 'bg-orange-500/15 text-orange-600 dark:text-orange-400' },
    { icon: CheckSquare, title: t('vocabFlashcards'), description: t('vocabFlashcardsDesc'), gradient: 'from-purple-500/20 to-pink-500/20', iconBg: 'bg-purple-500/15 text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="flex flex-col items-center pb-12">
      <div className="text-center py-16 md:py-24 max-w-3xl mx-auto">
        <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl gradient-primary shadow-glow">
          <GraduationCap className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
          {t('yourUltimate')}
          <span className="block text-primary mt-2">{t('studyCompanion')}</span>
        </h1>
        <p className="mb-10 max-w-xl mx-auto text-lg md:text-xl text-muted-foreground leading-relaxed">
          {t('homeDesc')}
        </p>
        <Button size="lg" onClick={() => navigate('/auth?mode=signup')}
          className="rounded-full px-10 py-7 text-lg font-semibold shadow-glow">
          {t('getStartedFree')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <div className="text-center mb-10 w-full">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">{t('features')}</span>
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('everythingYouNeed')}</h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 w-full max-w-4xl">
        {features.map((feature, index) => (
          <div key={index}
            className={`rounded-3xl bg-gradient-to-br ${feature.gradient} border border-border/50 p-6 md:p-8 shadow-card`}>
            <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg}`}>
              <feature.icon className="h-7 w-7" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-foreground">{feature.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 text-center max-w-lg mx-auto">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">{t('readyToTransform')}</h3>
        <p className="text-muted-foreground mb-8">{t('joinStudents')}</p>
        <Button size="lg" onClick={() => navigate('/auth?mode=signup')}
          className="rounded-full px-8 py-6 text-base font-semibold shadow-glow">
          {t('createFreeAccount')}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

function LoggedInHomePage() {
  const { settings } = useUserSettings();
  const { t } = useLanguage();
  const [phraseIndex, setPhraseIndex] = useState(0);

  const motivationalPhrases = useMemo(() => [
    { text: t('organizeMaterials'), action: t('studyMaterials'), link: "/materials" },
    { text: t('pomodoroTimerTitle'), action: t('pomodoroTimer'), link: "/pomodoro" },
    { text: t('vocabFlashcards'), action: t('vocabulary'), link: "/vocabulary" },
  ], [t]);

  useEffect(() => {
    const interval = setInterval(() => {
      setPhraseIndex(prev => (prev + 1) % motivationalPhrases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [motivationalPhrases.length]);

  const displayName = settings?.display_name || 'Student';
  const currentPhrase = motivationalPhrases[phraseIndex];

  return (
    <div className="flex flex-col items-center pb-12">
      <div className="text-center py-12 md:py-20 max-w-2xl mx-auto">
        <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary shadow-glow">
          <GraduationCap className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-5xl">
          {t('welcomeBackUser')} <span className="text-primary">{displayName}!</span>
        </h1>
        <p className="mb-8 max-w-lg mx-auto text-base md:text-lg text-muted-foreground leading-relaxed">
          {t('homeWelcomeDesc')}
        </p>
        <Link to="/materials">
          <Button size="lg" className="rounded-full px-8 py-6 text-base font-semibold shadow-glow">
            {t('goToMaterials')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-3 w-full max-w-3xl mb-12">
        {[
          { icon: BookOpen, label: t('studyMaterials'), to: '/materials', color: 'text-emerald-500' },
          { icon: Timer, label: t('pomodoroTimer'), to: '/pomodoro', color: 'text-orange-500' },
          { icon: CheckSquare, label: t('vocabulary'), to: '/vocabulary', color: 'text-purple-500' },
        ].map((item, i) => (
          <Link key={i} to={item.to} className="flex flex-col items-center gap-3 p-5 rounded-2xl bg-card border border-border/50 shadow-card transition-shadow duration-150 hover:shadow-soft active:scale-[0.98] gpu">
            <item.icon className={`h-7 w-7 ${item.color}`} />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </Link>
        ))}
      </div>

      <div className="w-full max-w-xl">
        <div className="rounded-3xl bg-card border border-border/50 shadow-card p-6 md:p-8 text-center min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 gradient-primary opacity-50 rounded-t-3xl" />
          <div key={phraseIndex} className="flex flex-col items-center gap-4">
              <p className="text-lg font-medium text-foreground">{currentPhrase.text}</p>
              <Link to={currentPhrase.link}>
                <Button variant="outline" className="rounded-full px-6 text-sm font-medium">
                  {currentPhrase.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
          </div>
          <div className="flex gap-1.5 mt-6">
            {motivationalPhrases.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === phraseIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/20'}`} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        {t('installApp')}
      </p>
    </div>
  );
}

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <HomeSkeleton />;
  }

  return user ? <LoggedInHomePage /> : <GuestHomePage />;
};

export default Index;
