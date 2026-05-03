import { useState, useMemo } from 'react';
import { useFlashcards, TestCount, TestMode, TestFormat } from '@/hooks/useFlashcards';
import { useVocabularyGroups } from '@/hooks/useVocabularyGroups';
import { Flashcard } from '@/components/vocabulary/Flashcard';
import { FlashcardControls } from '@/components/vocabulary/FlashcardControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, ArrowRight, Sparkles, CheckCircle2, XCircle, ThumbsUp, AlertTriangle,
  Shuffle, Layers, ListChecks, Keyboard, Zap, Trophy, WifiOff, CalendarDays,
  Flame, FolderOpen, PencilLine, Play, ChevronLeft, Volume2, Flag, Eye, HelpCircle, Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { VocabularyLogo } from '@/components/vocabulary/VocabularyLogo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type StartTestFn = ReturnType<typeof useFlashcards>['startTest'];

// Glassy step badge with the step number
function StepBadge({ n }: { n: number }) {
  return (
    <div
      className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-white shadow-lg backdrop-blur-xl border border-white/30"
      style={{
        background: 'linear-gradient(135deg, hsl(174 72% 56% / 0.85), hsl(186 90% 42% / 0.7))',
        boxShadow: '0 8px 24px hsl(174 72% 56% / 0.35), inset 0 1px 0 hsl(0 0% 100% / 0.4)',
      }}
    >
      {n}
    </div>
  );
}

function StepHeader({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <StepBadge n={n} />
      <h2 className="text-lg sm:text-xl font-bold text-foreground flex-1">{title}</h2>
    </div>
  );
}

function TestSetup({ totalWords, allWords, onStart }: { totalWords: number; allWords: any[]; onStart: StartTestFn }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [count, setCount] = useState<TestCount>(10);
  const [mode, setMode] = useState<TestMode>('flashcard');
  const [format, setFormat] = useState<TestFormat>('random');
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const { groups } = useVocabularyGroups();

  const availableDates = useMemo(() => {
    const dateMap = new Map<string, number>();
    allWords.forEach(w => {
      const date = new Date(w.created_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });
    return Array.from(dateMap.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allWords]);

  const counts: TestCount[] = [10, 20, 30, 40, 50, 60, 70, 80, 'all'];

  const modes: { value: TestMode; label: string; desc: string; icon: any; gradient: string }[] = [
    {
      value: 'flashcard',
      label: t('flashcards') || 'Flashcards',
      desc: t('flashcardModeDesc') || 'Flip cards to reveal the meaning. Rate how well you knew each word so the system schedules smart reviews.',
      icon: Layers,
      gradient: 'linear-gradient(135deg, hsl(265 85% 65% / 0.85), hsl(280 80% 55% / 0.65))',
    },
    {
      value: 'mcq',
      label: t('multipleChoice') || 'Multiple Choice',
      desc: t('mcqModeDesc') || 'Pick the correct meaning from four choices. Quick, fun, and great for fast recognition practice.',
      icon: ListChecks,
      gradient: 'linear-gradient(135deg, hsl(200 90% 60% / 0.85), hsl(220 85% 50% / 0.65))',
    },
    {
      value: 'typing',
      label: t('typing') || 'Type the Meaning',
      desc: t('typingModeDesc') || 'The English word is shown and you type its meaning. Builds active recall of definitions.',
      icon: Keyboard,
      gradient: 'linear-gradient(135deg, hsl(35 95% 60% / 0.85), hsl(20 90% 55% / 0.65))',
    },
    {
      value: 'reverse-typing',
      label: t('reverseTyping') || 'Type the Word',
      desc: t('reverseTypingDesc') || 'The meaning is shown and you write the English word with correct spelling. Letter case is ignored.',
      icon: PencilLine,
      gradient: 'linear-gradient(135deg, hsl(150 75% 50% / 0.85), hsl(170 80% 42% / 0.65))',
    },
  ];

  const formats: { value: TestFormat; label: string; desc: string; icon: any; gradient: string }[] = [
    {
      value: 'random',
      label: t('random') || 'Random',
      desc: t('randomFormatDesc') || 'Quizzes you on a random selection from every word you have, including difficult ones and grouped ones.',
      icon: Shuffle,
      gradient: 'linear-gradient(135deg, hsl(174 72% 56% / 0.85), hsl(186 90% 42% / 0.65))',
    },
    {
      value: 'difficult',
      label: t('difficultWords') || 'Difficult Words',
      desc: t('difficultFormatDesc') || 'Test only the words you previously marked as difficult so you can master them faster.',
      icon: Flame,
      gradient: 'linear-gradient(135deg, hsl(0 80% 60% / 0.85), hsl(15 85% 50% / 0.65))',
    },
    {
      value: 'date',
      label: t('byDate') || 'Test by Date',
      desc: t('byDateFormatDesc') || 'Choose one or more days you added words on, and the test will combine them all into one session.',
      icon: CalendarDays,
      gradient: 'linear-gradient(135deg, hsl(220 85% 60% / 0.85), hsl(245 80% 55% / 0.65))',
    },
    {
      value: 'group',
      label: t('byGroup') || 'Test by Group',
      desc: t('byGroupFormatDesc') || 'Pick one or more vocabulary groups you created, and the test will mix words from all of them.',
      icon: FolderOpen,
      gradient: 'linear-gradient(135deg, hsl(45 95% 55% / 0.85), hsl(35 90% 50% / 0.65))',
    },
  ];

  const needsExtraStep = format === 'date' || format === 'group';
  const [showSubStep, setShowSubStep] = useState(false);

  const canStart = () => {
    if (format === 'date') return selectedDates.length > 0;
    if (format === 'group') return selectedGroupIds.length > 0;
    if (format === 'difficult') return allWords.some((w: any) => w.is_difficult);
    return totalWords > 0;
  };

  const handleStart = () => {
    onStart(count, mode, format, { selectedDates, selectedGroupIds });
  };

  const toggleDate = (d: string) =>
    setSelectedDates(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  const toggleGroup = (id: string) =>
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {!isOnline && (
        <div className="flex items-center gap-2 rounded-2xl bg-accent border border-border px-4 py-3 text-sm text-accent-foreground">
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t('offlineMode') || 'Offline mode — using cached vocabulary'}</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* STEP 1: number of questions */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <StepHeader n={1} title={t('selectQuestionCount') || 'Select the number of test questions:'} />
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-3">
              {counts.map((c, i) => (
                <motion.button
                  key={String(c)}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => setCount(c)}
                  className={cn(
                    'rounded-[1.75rem] py-4 text-base font-semibold border-2 transition-all duration-200 backdrop-blur-md active:scale-[0.97]',
                    count === c
                      ? 'border-primary text-primary-foreground shadow-lg scale-[1.03]'
                      : 'border-border bg-card/70 text-foreground hover:border-primary/40 hover:bg-accent'
                  )}
                  style={count === c ? {
                    background: 'linear-gradient(135deg, hsl(174 72% 56% / 0.95), hsl(186 90% 42% / 0.85))',
                    boxShadow: '0 8px 24px hsl(174 72% 56% / 0.35)',
                  } : {}}
                >
                  {c === 'all' ? `${t('allWords') || 'All'} (${totalWords})` : c}
                </motion.button>
              ))}
            </div>

            <div className="pt-6">
              <Button
                onClick={() => setStep(2)}
                disabled={totalWords === 0}
                className="w-full rounded-[1.75rem] py-6 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                style={{
                  background: 'linear-gradient(135deg, hsl(174 72% 56%), hsl(186 90% 42%))',
                  color: 'white',
                }}
              >
                {t('next') || 'Next'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 2: test method */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <StepHeader n={2} title={t('selectTestMethod') || 'Select the test method:'} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {modes.map((m, i) => {
                const isSelected = mode === m.value;
                return (
                  <motion.button
                    key={m.value}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setMode(m.value)}
                    className={cn(
                      'relative rounded-[2rem] p-5 text-left border-2 transition-all duration-200 backdrop-blur-md active:scale-[0.98] overflow-hidden',
                      isSelected
                        ? 'border-white/40 shadow-2xl scale-[1.02] text-white'
                        : 'border-border bg-card/70 hover:border-primary/40'
                    )}
                    style={isSelected ? {
                      background: m.gradient,
                      boxShadow: '0 16px 40px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.3)',
                    } : {}}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-2xl',
                          isSelected ? 'bg-white/25 backdrop-blur-md' : 'bg-primary/10'
                        )}
                      >
                        <m.icon className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-primary')} />
                      </div>
                      <p className={cn('font-bold text-base', isSelected ? 'text-white' : 'text-foreground')}>{m.label}</p>
                      {isSelected && (
                        <CheckCircle2 className="ml-auto h-5 w-5 text-white" />
                      )}
                    </div>
                    <p className={cn('text-sm leading-relaxed', isSelected ? 'text-white/90' : 'text-muted-foreground')}>
                      {m.desc}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 rounded-[1.75rem] py-6 font-semibold"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                {t('back') || 'Back'}
              </Button>
              <Button
                onClick={() => { setStep(3); setShowSubStep(false); }}
                className="flex-1 rounded-[1.75rem] py-6 font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, hsl(174 72% 56%), hsl(186 90% 42%))' }}
              >
                {t('next') || 'Next'}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* STEP 3: test format */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
          >
            <StepHeader n={3} title={t('selectTestFormat') || 'Choose the test format that suits you:'} />

            {!showSubStep && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formats.map((f, i) => {
                  const isSelected = format === f.value;
                  return (
                    <motion.button
                      key={f.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setFormat(f.value)}
                      className={cn(
                        'relative rounded-[2rem] p-5 text-left border-2 transition-all duration-200 backdrop-blur-md active:scale-[0.98] overflow-hidden',
                        isSelected
                          ? 'border-white/40 shadow-2xl scale-[1.02] text-white'
                          : 'border-border bg-card/70 hover:border-primary/40'
                      )}
                      style={isSelected ? {
                        background: f.gradient,
                        boxShadow: '0 16px 40px hsl(0 0% 0% / 0.2), inset 0 1px 0 hsl(0 0% 100% / 0.3)',
                      } : {}}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-2xl',
                          isSelected ? 'bg-white/25 backdrop-blur-md' : 'bg-primary/10'
                        )}>
                          <f.icon className={cn('h-5 w-5', isSelected ? 'text-white' : 'text-primary')} />
                        </div>
                        <p className={cn('font-bold text-base', isSelected ? 'text-white' : 'text-foreground')}>{f.label}</p>
                        {isSelected && <CheckCircle2 className="ml-auto h-5 w-5 text-white" />}
                      </div>
                      <p className={cn('text-sm leading-relaxed', isSelected ? 'text-white/90' : 'text-muted-foreground')}>
                        {f.desc}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Sub-step: date selection */}
            {showSubStep && format === 'date' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('selectMultipleDates') || 'Pick one or more dates to combine into your test.'}
                </p>
                {availableDates.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noDatesAvailable') || 'No dates available'}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto rounded-[1.75rem] border border-border p-3 bg-card/70 backdrop-blur-md">
                    {availableDates.map(([date, wordCount]) => {
                      const isSel = selectedDates.includes(date);
                      return (
                        <motion.button
                          key={date}
                          onClick={() => toggleDate(date)}
                          className={cn(
                            'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium border-2 transition-all',
                            isSel
                              ? 'border-primary bg-primary/15 text-primary'
                              : 'border-transparent hover:bg-accent text-foreground'
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            {(() => {
                              try { return new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); }
                              catch { return date; }
                            })()}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="text-xs bg-secondary text-secondary-foreground rounded-full px-2 py-0.5">
                              {wordCount} {t('words') || 'words'}
                            </span>
                            {isSel && <CheckCircle2 className="h-4 w-4 text-primary" />}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {/* Sub-step: group selection */}
            {showSubStep && format === 'group' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('selectMultipleGroups') || 'Pick one or more groups to combine into your test.'}
                </p>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noGroupsAvailable') || 'No groups created yet.'}</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {groups.map(g => {
                      const isSel = selectedGroupIds.includes(g.id);
                      return (
                        <motion.button
                          key={g.id}
                          onClick={() => toggleGroup(g.id)}
                          className={cn(
                            'flex items-center gap-3 rounded-[1.75rem] px-4 py-4 border-2 transition-all text-left',
                            isSel
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border bg-card/70 hover:border-primary/40'
                          )}
                        >
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                            <FolderOpen className="h-5 w-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{g.name}</p>
                            <p className="text-xs text-muted-foreground">{g.word_count || 0} {t('words') || 'words'}</p>
                          </div>
                          {isSel && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            <div className="flex gap-3 pt-6">
              <Button
                variant="outline"
                onClick={() => {
                  if (showSubStep) setShowSubStep(false);
                  else setStep(2);
                }}
                className="flex-1 rounded-[1.75rem] py-6 font-semibold"
              >
                <ChevronLeft className="mr-2 h-5 w-5" />
                {t('back') || 'Back'}
              </Button>
              {needsExtraStep && !showSubStep ? (
                <Button
                  onClick={() => setShowSubStep(true)}
                  className="flex-1 rounded-[1.75rem] py-6 font-semibold text-white"
                  style={{ background: 'linear-gradient(135deg, hsl(174 72% 56%), hsl(186 90% 42%))' }}
                >
                  {t('next') || 'Next'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              ) : (
                <Button
                  onClick={handleStart}
                  disabled={!canStart()}
                  className="flex-1 rounded-[1.75rem] py-6 font-semibold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, hsl(174 72% 56%), hsl(186 90% 42%))' }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  {t('startTest') || 'Start Test'}
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function TestResults({ results, onRestart }: { results: ReturnType<typeof useFlashcards>['results']; onRestart: () => void }) {
  const { t } = useLanguage();
  const easy = results.filter(r => r.quality >= 4).length;
  const hard = results.filter(r => r.quality === 3).length;
  const failed = results.filter(r => r.quality < 3).length;
  const difficultWords = results.filter(r => r.quality < 3);
  const score = results.length > 0 ? Math.round((easy / results.length) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      {/* Score circle */}
      <div className="text-center py-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="relative inline-flex items-center justify-center"
        >
          <svg className="h-32 w-32 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" className="stroke-muted" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeLinecap="round"
              className="stroke-primary"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: score / 100 }}
              transition={{ duration: 1, delay: 0.4 }}
              style={{ strokeDasharray: '264', strokeDashoffset: '0' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground">{score}%</span>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <h2 className="text-xl font-bold text-foreground mt-3">{t('testComplete')}</h2>
          <p className="text-sm text-muted-foreground">{results.length} {t('wordsReviewed')}</p>
        </motion.div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { count: easy, label: t('easy'), Icon: ThumbsUp, color: 'text-green-500', bg: 'bg-green-500/10 border-green-500/20' },
          { count: hard, label: t('hard'), Icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' },
          { count: failed, label: t('failed'), Icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.08 }}
            className={cn('rounded-2xl border p-3 text-center', s.bg)}
          >
            <s.Icon className={cn('h-5 w-5 mx-auto mb-1', s.color)} />
            <p className={cn('text-xl font-bold', s.color)}>{s.count}</p>
            <p className="text-[11px] text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Difficult words */}
      {difficultWords.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}>
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            {t('wordsToReview')}
          </h3>
          <div className="space-y-1.5">
            {difficultWords.map((w, i) => (
              <motion.div
                key={w.wordId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + i * 0.04 }}
                className="flex justify-between items-center bg-destructive/5 border border-destructive/15 rounded-xl px-4 py-2.5"
              >
                <span className="font-semibold text-primary text-sm">{w.word}</span>
                <span className="text-destructive text-sm font-medium" dir="rtl">{w.meanings}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      <div className="flex gap-3 pt-2">
        <Button onClick={onRestart} className="flex-1 rounded-2xl py-5 font-semibold">
          <Trophy className="mr-2 h-4 w-4" />
          {t('testAgain')}
        </Button>
        <Link to="/vocabulary" className="flex-1">
          <Button variant="outline" className="w-full rounded-2xl py-5 font-semibold">{t('backToVocabulary')}</Button>
        </Link>
      </div>
    </motion.div>
  );
}

function MCQCard({ card, options, answered, selectedIndex, onAnswer }: {
  card: ReturnType<typeof useFlashcards>['currentCard'];
  options: ReturnType<typeof useFlashcards>['mcqOptions'];
  answered: boolean;
  selectedIndex: number | null;
  onAnswer: (index: number) => void;
}) {
  const { t } = useLanguage();
  if (!card) return null;

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center shadow-md"
      >
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">{t('whatDoesWordMean')}</p>
        <h2 className="text-4xl font-bold text-primary">{card.word}</h2>
      </motion.div>
      <div className="grid grid-cols-1 gap-2">
        {options.map((opt, i) => {
          let cls = 'border-border bg-card hover:border-primary/40 hover:bg-accent';
          if (answered) {
            if (opt.isCorrect) cls = 'border-green-500 bg-green-500/10';
            else if (i === selectedIndex) cls = 'border-destructive bg-destructive/10 shake';
            else cls = 'border-border bg-card opacity-40';
          }
          return (
            <motion.button
              key={i}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              onClick={() => onAnswer(i)}
              disabled={answered}
              className={cn('rounded-2xl p-4 text-right border-2 transition-all font-medium text-base', cls)}
              dir="rtl"
            >
              {opt.text}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function TypingCard({ card, answer, setAnswer, submitted, onSubmit, mode }: {
  card: ReturnType<typeof useFlashcards>['currentCard'];
  answer: string;
  setAnswer: (v: string) => void;
  submitted: boolean;
  onSubmit: () => boolean | undefined;
  mode: TestMode;
}) {
  const { t } = useLanguage();
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (!card) return null;

  const isReverse = mode === 'reverse-typing';
  const promptLabel = isReverse
    ? (t('typeWord') || 'Type the English word')
    : (t('typeMeaning') || 'Type the meaning');
  const displayedText = isReverse ? card.meanings : card.word;
  const correctReveal = isReverse ? card.word : card.meanings;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitted || !answer.trim()) return;
    const result = onSubmit();
    setIsCorrect(result ?? false);
  };

  return (
    <div className="space-y-5">
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center shadow-md"
      >
        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
          {promptLabel}
        </p>
        <h2 className="text-4xl font-bold text-primary" dir={isReverse ? 'rtl' : 'ltr'}>{displayedText}</h2>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <Input
          value={answer}
          onChange={e => setAnswer(e.target.value)}
          placeholder={t('typeYourAnswer') || 'Type your answer...'}
          className={cn(
            'rounded-2xl py-6 text-center text-lg font-medium transition-all',
            submitted && isCorrect === true && 'border-green-500 bg-green-500/10',
            submitted && isCorrect === false && 'border-destructive bg-destructive/10'
          )}
          disabled={submitted}
          autoFocus
          dir={isReverse ? 'ltr' : 'rtl'}
        />
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'rounded-xl px-4 py-3 text-center text-sm font-medium',
              isCorrect ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'
            )}
          >
            {isCorrect
              ? (t('correct') || '✓ Correct!')
              : `${t('incorrect') || '✗ Incorrect'}: ${correctReveal}`}
          </motion.div>
        )}
        {!submitted && (
          <Button type="submit" disabled={!answer.trim()} className="w-full rounded-2xl py-5 font-semibold">
            {t('checkAnswer') || 'Check Answer'}
          </Button>
        )}
      </form>
    </div>
  );
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();
  const {
    allWords, currentCard, isFlipped, isLoading, totalTestCards, completedCount, progress,
    testStarted, testFinished, testMode, results, mcqOptions, mcqAnswered, mcqSelectedIndex,
    typingAnswer, setTypingAnswer, typingSubmitted, submitTypingAnswer,
    flipCard, rateCard, answerMCQ, startTest, resetTest,
  } = useFlashcards();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('signInToPractice')}</h2>
        <p className="text-muted-foreground">{t('createAccountForFlashcards')}</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <Link to="/vocabulary">
          <Button variant="ghost" size="sm" className="gap-2 rounded-xl">
            <ArrowLeft className="h-4 w-4" />
            {t('back')}
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {!isOnline && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground bg-accent rounded-full px-2.5 py-1">
              <WifiOff className="h-3 w-3" />
              {t('offline') || 'Offline'}
            </span>
          )}
          {testStarted && !testFinished && (
            <span className="text-sm font-semibold text-muted-foreground tabular-nums bg-secondary rounded-full px-3 py-1">
              {completedCount}/{totalTestCards}
            </span>
          )}
        </div>
      </div>

      {/* Progress during test */}
      {testStarted && !testFinished && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <Progress value={progress} className="h-1.5 rounded-full" />
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t('loading') || 'Loading...'}</p>
        </div>
      ) : testFinished ? (
        <TestResults results={results} onRestart={resetTest} />
      ) : testStarted ? (
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCard?.id || 'done'}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
          >
            {currentCard ? (
              testMode === 'mcq' ? (
                <MCQCard card={currentCard} options={mcqOptions} answered={mcqAnswered} selectedIndex={mcqSelectedIndex} onAnswer={answerMCQ} />
              ) : (testMode === 'typing' || testMode === 'reverse-typing') ? (
                <TypingCard card={currentCard} answer={typingAnswer} setAnswer={setTypingAnswer} submitted={typingSubmitted} onSubmit={submitTypingAnswer} mode={testMode} />
              ) : (
                <>
                  <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />
                  {isFlipped && <FlashcardControls onRate={rateCard} disabled={!isFlipped} />}
                </>
              )
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">{t('noWordsFound') || 'No words available'}</p>
                <Button onClick={resetTest} className="mt-4 rounded-2xl">{t('back')}</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      ) : (
        <TestSetup totalWords={allWords.length} allWords={allWords} onStart={startTest} />
      )}
    </div>
  );
}
