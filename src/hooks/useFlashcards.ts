import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FlashcardWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
}

export type TestMode = 'flashcard' | 'mcq';
export type TestFormat = 'random' | 'focus' | 'smart';
export type TestCount = 10 | 20 | 30 | 40 | 50 | 'all';

export interface TestResult {
  wordId: string;
  word: string;
  meanings: string;
  quality: number; // 1-5
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

// SM-2 Algorithm implementation
function calculateNextReview(
  quality: number,
  easeFactor: number,
  intervalDays: number,
  repetitions: number
): { easeFactor: number; intervalDays: number; repetitions: number; nextReviewAt: Date } {
  let newEaseFactor = easeFactor;
  let newIntervalDays = intervalDays;
  let newRepetitions = repetitions;

  if (quality < 3) {
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    if (newRepetitions === 0) {
      newIntervalDays = 1;
    } else if (newRepetitions === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor);
    }
    newRepetitions += 1;
  }

  newEaseFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newIntervalDays);

  return {
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    intervalDays: newIntervalDays,
    repetitions: newRepetitions,
    nextReviewAt,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function useFlashcards() {
  const { user } = useAuth();
  const [allWords, setAllWords] = useState<FlashcardWord[]>([]);
  const [cards, setCards] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);
  const [testMode, setTestMode] = useState<TestMode>('flashcard');
  const [mcqOptions, setMcqOptions] = useState<MCQOption[]>([]);
  const [mcqAnswered, setMcqAnswered] = useState(false);
  const [mcqSelectedIndex, setMcqSelectedIndex] = useState<number | null>(null);
  const [totalTestCards, setTotalTestCards] = useState(0);

  const fetchAllWords = useCallback(async () => {
    if (!user) {
      setAllWords([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from('vocabulary')
      .select('id, word, meanings, notes, ease_factor, interval_days, repetitions, next_review_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching flashcards:', error);
    } else {
      setAllWords((data || []).map(card => ({
        ...card,
        ease_factor: Number(card.ease_factor) || 2.5,
        interval_days: card.interval_days || 0,
        repetitions: card.repetitions || 0,
        next_review_at: card.next_review_at || new Date().toISOString(),
      })));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAllWords();
  }, [fetchAllWords]);

  const generateMCQOptions = useCallback((correctCard: FlashcardWord, pool: FlashcardWord[]) => {
    const others = pool.filter(w => w.id !== correctCard.id);
    const wrongChoices = shuffleArray(others).slice(0, 3).map(w => w.meanings);
    
    // Pad with placeholder if not enough words
    while (wrongChoices.length < 3) {
      wrongChoices.push('—');
    }
    
    const options: MCQOption[] = shuffleArray([
      { text: correctCard.meanings, isCorrect: true },
      ...wrongChoices.map(t => ({ text: t, isCorrect: false })),
    ]);
    setMcqOptions(options);
    setMcqAnswered(false);
    setMcqSelectedIndex(null);
  }, []);

  const startTest = useCallback((count: TestCount, mode: TestMode, format: TestFormat) => {
    let filtered: FlashcardWord[];
    const now = new Date();

    if (format === 'focus') {
      // Words rated poor/difficult: ease_factor < 2.0 or repetitions <= 1
      filtered = allWords.filter(w => w.ease_factor < 2.0 || w.repetitions <= 1);
    } else if (format === 'smart') {
      // Words due for review or not reviewed in a long time
      filtered = [...allWords].sort((a, b) => {
        const aDate = new Date(a.next_review_at);
        const bDate = new Date(b.next_review_at);
        // Prioritize overdue words, then by longest since last review
        const aOverdue = aDate <= now ? -aDate.getTime() : aDate.getTime();
        const bOverdue = bDate <= now ? -bDate.getTime() : bDate.getTime();
        return aOverdue - bOverdue;
      });
    } else {
      filtered = shuffleArray(allWords);
    }

    if (filtered.length === 0) filtered = shuffleArray(allWords);

    const limit = count === 'all' ? filtered.length : Math.min(count, filtered.length);
    const selected = filtered.slice(0, limit);

    setCards(format === 'random' ? shuffleArray(selected) : selected);
    setTotalTestCards(selected.length);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTestStarted(true);
    setTestFinished(false);
    setResults([]);
    setTestMode(mode);

    if (mode === 'mcq' && selected.length > 0) {
      generateMCQOptions(selected[0], allWords);
    }
  }, [allWords, generateMCQOptions]);

  const currentCard = cards[currentIndex] || null;

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const rateCard = useCallback(async (quality: number) => {
    if (!user || !currentCard) return;

    const { easeFactor, intervalDays, repetitions, nextReviewAt } = calculateNextReview(
      quality,
      currentCard.ease_factor,
      currentCard.interval_days,
      currentCard.repetitions
    );

    await supabase
      .from('vocabulary')
      .update({
        ease_factor: easeFactor,
        interval_days: intervalDays,
        repetitions: repetitions,
        next_review_at: nextReviewAt.toISOString(),
      })
      .eq('id', currentCard.id)
      .eq('user_id', user.id);

    setResults(prev => [...prev, {
      wordId: currentCard.id,
      word: currentCard.word,
      meanings: currentCard.meanings,
      quality,
    }]);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      setTestFinished(true);
    } else {
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      if (testMode === 'mcq') {
        generateMCQOptions(cards[nextIndex], allWords);
      }
    }
  }, [user, currentCard, currentIndex, cards, testMode, allWords, generateMCQOptions]);

  const answerMCQ = useCallback((optionIndex: number) => {
    if (mcqAnswered) return;
    setMcqAnswered(true);
    setMcqSelectedIndex(optionIndex);
    const isCorrect = mcqOptions[optionIndex]?.isCorrect;
    
    // Auto-rate: correct = 4 (Good), wrong = 1 (Again)
    setTimeout(() => {
      rateCard(isCorrect ? 4 : 1);
    }, 1200);
  }, [mcqAnswered, mcqOptions, rateCard]);

  const resetTest = useCallback(() => {
    setTestStarted(false);
    setTestFinished(false);
    setCards([]);
    setResults([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    fetchAllWords();
  }, [fetchAllWords]);

  const completedCount = results.length;
  const remaining = totalTestCards - completedCount;
  const progress = totalTestCards > 0 ? (completedCount / totalTestCards) * 100 : 0;

  return {
    allWords,
    currentCard,
    isFlipped,
    isLoading,
    totalTestCards,
    remaining,
    completedCount,
    progress,
    testStarted,
    testFinished,
    testMode,
    results,
    mcqOptions,
    mcqAnswered,
    mcqSelectedIndex,
    flipCard,
    rateCard,
    answerMCQ,
    startTest,
    resetTest,
    refetch: fetchAllWords,
  };
}
