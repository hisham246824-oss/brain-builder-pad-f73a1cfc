import { useState, useMemo } from 'react';
import { useFlashcards, TestCount, TestMode, TestFormat } from '@/hooks/useFlashcards';
import { Flashcard } from '@/components/vocabulary/Flashcard';
import { FlashcardControls } from '@/components/vocabulary/FlashcardControls';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeft, Sparkles, CheckCircle2, XCircle, ThumbsUp, AlertTriangle,
  Shuffle, Target, Brain, Layers, ListChecks, Keyboard, Zap, Trophy, WifiOff, CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

function TestSetup({ totalWords, onStart }: { totalWords: number; onStart: (count: TestCount, mode: TestMode, format: TestFormat) => void }) {
  const [count, setCount] = useState<TestCount>(10);
  const [mode, setMode] = useState<TestMode>('flashcard');
  const [format, setFormat] = useState<TestFormat>('random');
  const { t } = useLanguage();
  const { isOnline } = useNetworkStatus();

  const counts: TestCount[] = [10, 20, 30, 40, 50, 'all'];

  const modes = [
    { value: 'flashcard' as TestMode, label: t('flashcards'), desc: t('flipToReveal'), icon: Layers },
    { value: 'mcq' as TestMode, label: t('multipleChoice'), desc: t('pickCorrect'), icon: ListChecks },
    { value: 'typing' as TestMode, label: t('typing') || 'Typing', desc: t('typingDesc') || 'Type the meaning from memory', icon: Keyboard },
  ];

  const formats = [
    { value: 'random' as TestFormat, label: t('random'), desc: t('randomDesc'), icon: Shuffle, emoji: '🎲' },
    { value: 'focus' as TestFormat, label: t('focus'), desc: t('focusDesc'), icon: Target, emoji: '🎯' },
    { value: 'smart' as TestFormat, label: t('smartReview'), desc: t('smartDesc'), icon: Brain, emoji: '🧠' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Offline badge */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-2xl bg-accent border border-border px-4 py-3 text-sm text-accent-foreground"
        >
          <WifiOff className="h-4 w-4 shrink-0" />
          <span>{t('offlineMode') || 'Offline mode — using cached vocabulary'}</span>
        </motion.div>
      )}

      {/* Count Selection */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">{t('numberOfWords')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {counts.map((c, i) => (
            <motion.button
              key={String(c)}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              onClick={() => setCount(c)}
              className={cn(
                'rounded-2xl py-3.5 text-sm font-semibold border-2 transition-all duration-200',
                count === c
                  ? 'border-primary bg-primary text-primary-foreground shadow-md scale-[1.02]'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent'
              )}
            >
              {c === 'all' ? `${t('allWords') || 'All'} (${totalWords})` : c}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Mode Selection */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">{t('testType')}</h3>
        <div className="grid grid-cols-3 gap-2">
          {modes.map((m, i) => (
            <motion.button
              key={m.value}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => setMode(m.value)}
              className={cn(
                'rounded-2xl p-3 text-center border-2 transition-all duration-200',
                mode === m.value
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <m.icon className={cn('h-6 w-6 mx-auto mb-2', mode === m.value ? 'text-primary' : 'text-muted-foreground')} />
              <p className="font-semibold text-foreground text-xs">{m.label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{m.desc}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Format Selection */}
      <div>
        <h3 className="text-base font-semibold text-foreground mb-3">{t('testFormat')}</h3>
        <div className="space-y-2">
          {formats.map((f, i) => (
            <motion.button
              key={f.value}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.06 }}
              onClick={() => setFormat(f.value)}
              className={cn(
                'w-full rounded-2xl p-4 flex items-center gap-4 border-2 transition-all duration-200',
                format === f.value
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-card hover:border-primary/40'
              )}
            >
              <span className="text-2xl">{f.emoji}</span>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">{f.label}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
              {format === f.value && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Button
          onClick={() => onStart(count, mode, format)}
          disabled={totalWords === 0}
          className="w-full rounded-2xl py-6 text-lg font-semibold shadow-md hover:shadow-lg transition-shadow"
        >
          <Zap className="mr-2 h-5 w-5" />
          {t('startTest')}
        </Button>
      </motion.div>
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

function TypingCard({ card, answer, setAnswer, submitted, onSubmit }: {
  card: ReturnType<typeof useFlashcards>['currentCard'];
  answer: string;
  setAnswer: (v: string) => void;
  submitted: boolean;
  onSubmit: () => boolean | undefined;
}) {
  const { t } = useLanguage();
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  if (!card) return null;

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
          {t('typeMeaning') || 'Type the meaning'}
        </p>
        <h2 className="text-4xl font-bold text-primary">{card.word}</h2>
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
          dir="rtl"
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
              : `${t('incorrect') || '✗ Incorrect'}: ${card.meanings}`}
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
              ) : testMode === 'typing' ? (
                <TypingCard card={currentCard} answer={typingAnswer} setAnswer={setTypingAnswer} submitted={typingSubmitted} onSubmit={submitTypingAnswer} />
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
        <TestSetup totalWords={allWords.length} onStart={startTest} />
      )}
    </div>
  );
}
