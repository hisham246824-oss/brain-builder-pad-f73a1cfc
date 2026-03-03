import { useState } from 'react';
import { useFlashcards, TestCount, TestMode, TestFormat } from '@/hooks/useFlashcards';
import { Flashcard } from '@/components/vocabulary/Flashcard';
import { FlashcardControls } from '@/components/vocabulary/FlashcardControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Sparkles, CheckCircle2, XCircle, ThumbsUp, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';

function TestSetup({ totalWords, onStart }: { totalWords: number; onStart: (count: TestCount, mode: TestMode, format: TestFormat) => void }) {
  const [count, setCount] = useState<TestCount>(10);
  const [mode, setMode] = useState<TestMode>('flashcard');
  const [format, setFormat] = useState<TestFormat>('random');

  const counts: TestCount[] = [10, 20, 30, 40, 50, 'all'];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      {/* Count */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Number of Words</h3>
        <div className="grid grid-cols-3 gap-2">
          {counts.map(c => (
            <button
              key={String(c)}
              onClick={() => setCount(c)}
              className={`rounded-2xl py-3 text-sm font-medium border-2 transition-all ${
                count === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:border-primary/50'
              }`}
            >
              {c === 'all' ? `All (${totalWords})` : c}
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Test Type</h3>
        <div className="grid grid-cols-2 gap-3">
          {([
            { value: 'flashcard' as TestMode, label: 'Flashcards', desc: 'Flip to reveal meaning' },
            { value: 'mcq' as TestMode, label: 'Multiple Choice', desc: 'Pick the correct answer' },
          ]).map(m => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={`rounded-2xl p-4 text-left border-2 transition-all ${
                mode === m.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <p className="font-semibold text-foreground">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-3">Test Format</h3>
        <div className="space-y-2">
          {([
            { value: 'random' as TestFormat, label: '🎲 Random', desc: 'Random selection of words' },
            { value: 'focus' as TestFormat, label: '🎯 Focus', desc: 'Only words rated poor or difficult' },
            { value: 'smart' as TestFormat, label: '🧠 Smart Review', desc: 'Words needing review based on algorithm' },
          ]).map(f => (
            <button
              key={f.value}
              onClick={() => setFormat(f.value)}
              className={`w-full rounded-2xl p-4 text-left border-2 transition-all ${
                format === f.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-card hover:border-primary/50'
              }`}
            >
              <p className="font-semibold text-foreground">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      <Button
        onClick={() => onStart(count, mode, format)}
        disabled={totalWords === 0}
        className="w-full rounded-2xl py-6 text-lg font-medium"
      >
        Start Test
      </Button>
    </motion.div>
  );
}

function TestResults({ results, onRestart }: { results: ReturnType<typeof useFlashcards>['results']; onRestart: () => void }) {
  const easy = results.filter(r => r.quality >= 4).length;
  const hard = results.filter(r => r.quality === 3).length;
  const failed = results.filter(r => r.quality < 3).length;
  const difficultWords = results.filter(r => r.quality < 3);

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-foreground">Test Complete!</h2>
        <p className="text-muted-foreground mt-1">{results.length} words reviewed</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 text-center">
          <ThumbsUp className="h-6 w-6 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{easy}</p>
          <p className="text-xs text-muted-foreground">Easy</p>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-600">{hard}</p>
          <p className="text-xs text-muted-foreground">Hard</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 text-center">
          <XCircle className="h-6 w-6 text-red-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{failed}</p>
          <p className="text-xs text-muted-foreground">Failed</p>
        </div>
      </div>

      {/* Difficult words to review */}
      {difficultWords.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-3">Words to Review</h3>
          <div className="space-y-2">
            {difficultWords.map(w => (
              <div key={w.wordId} className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 flex justify-between items-center">
                <span className="font-medium text-foreground">{w.word}</span>
                <span className="text-destructive font-medium" dir="rtl">{w.meanings}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={onRestart} className="flex-1 rounded-2xl py-5">
          Test Again
        </Button>
        <Link to="/vocabulary" className="flex-1">
          <Button variant="outline" className="w-full rounded-2xl py-5">Back to Vocabulary</Button>
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
  if (!card) return null;

  return (
    <div className="space-y-6">
      <div className="bg-card border-2 border-primary/20 rounded-3xl p-8 text-center shadow-lg">
        <p className="text-sm text-muted-foreground mb-2">What does this word mean?</p>
        <h2 className="text-3xl font-bold text-foreground">{card.word}</h2>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {options.map((opt, i) => {
          let cls = 'border-border bg-card hover:border-primary/50';
          if (answered) {
            if (opt.isCorrect) cls = 'border-green-500 bg-green-500/10';
            else if (i === selectedIndex) cls = 'border-red-500 bg-red-500/10';
            else cls = 'border-border bg-card opacity-50';
          }
          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={answered}
              className={`rounded-2xl p-4 text-right border-2 transition-all font-medium text-lg ${cls}`}
              dir="rtl"
            >
              {opt.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FlashcardsPage() {
  const { user } = useAuth();
  const {
    allWords, currentCard, isFlipped, isLoading, totalTestCards, completedCount, progress,
    testStarted, testFinished, testMode, results, mcqOptions, mcqAnswered, mcqSelectedIndex,
    flipCard, rateCard, answerMCQ, startTest, resetTest,
  } = useFlashcards();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Sparkles className="h-12 w-12 text-primary/50 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Sign in to practice</h2>
        <p className="text-muted-foreground">Create an account to use flashcard practice</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link to="/vocabulary">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        {testStarted && !testFinished && (
          <div className="text-sm text-muted-foreground">
            {completedCount} / {totalTestCards}
          </div>
        )}
      </div>

      {/* Progress bar during test */}
      {testStarted && !testFinished && (
        <div className="mb-6">
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : testFinished ? (
        <TestResults results={results} onRestart={resetTest} />
      ) : testStarted ? (
        <AnimatePresence mode="wait">
          <motion.div key={currentCard?.id || 'done'} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }}>
            {currentCard ? (
              testMode === 'mcq' ? (
                <MCQCard card={currentCard} options={mcqOptions} answered={mcqAnswered} selectedIndex={mcqSelectedIndex} onAnswer={answerMCQ} />
              ) : (
                <>
                  <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />
                  {isFlipped && <FlashcardControls onRate={rateCard} disabled={!isFlipped} />}
                </>
              )
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No words available for this filter.</p>
                <Button onClick={resetTest} className="mt-4">Go Back</Button>
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
