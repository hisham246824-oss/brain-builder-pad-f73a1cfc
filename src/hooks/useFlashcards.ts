import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { getCachedVocabulary, addPendingAction } from '@/lib/offlineCache';

export interface FlashcardWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  created_at: string;
  is_difficult?: boolean;
  group_id?: string | null;
}

export type TestMode = 'flashcard' | 'mcq' | 'typing' | 'reverse-typing';
export type TestFormat = 'random' | 'difficult' | 'date' | 'group';
export type TestCount = 10 | 20 | 30 | 40 | 50 | 60 | 70 | 80 | 'all';

export interface TestResult {
  wordId: string;
  word: string;
  meanings: string;
  quality: number;
}

export interface MCQOption {
  text: string;
  isCorrect: boolean;
}

// SM-2 Algorithm
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
    if (newRepetitions === 0) newIntervalDays = 1;
    else if (newRepetitions === 1) newIntervalDays = 6;
    else newIntervalDays = Math.round(intervalDays * easeFactor);
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
  const { isOnline } = useNetworkStatus();
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
  const [typingAnswer, setTypingAnswer] = useState('');
  const [typingSubmitted, setTypingSubmitted] = useState(false);

  const mapWordData = (data: any[]): FlashcardWord[] =>
    data.map(card => ({
      ...card,
      ease_factor: Number(card.ease_factor) || 2.5,
      interval_days: card.interval_days || 0,
      repetitions: card.repetitions || 0,
      next_review_at: card.next_review_at || new Date().toISOString(),
      created_at: card.created_at || new Date().toISOString(),
    }));

  const fetchAllWords = useCallback(async () => {
    if (!user) {
      setAllWords([]);
      setIsLoading(false);
      return;
    }

    // Try online fetch first
    if (isOnline) {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vocabulary')
        .select('id, word, meanings, notes, ease_factor, interval_days, repetitions, next_review_at, created_at, is_difficult, group_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setAllWords(mapWordData(data));
        setIsLoading(false);
        return;
      }
    }

    // Offline fallback: use cached vocabulary
    const cached = getCachedVocabulary();
    if (cached) {
      setAllWords(mapWordData(cached));
    }
    setIsLoading(false);
  }, [user, isOnline]);

  useEffect(() => {
    fetchAllWords();
  }, [fetchAllWords]);

  const generateMCQOptions = useCallback((correctCard: FlashcardWord, pool: FlashcardWord[]) => {
    const others = pool.filter(w => w.id !== correctCard.id);
    const wrongChoices = shuffleArray(others).slice(0, 3).map(w => w.meanings);
    while (wrongChoices.length < 3) wrongChoices.push('—');

    const options: MCQOption[] = shuffleArray([
      { text: correctCard.meanings, isCorrect: true },
      ...wrongChoices.map(t => ({ text: t, isCorrect: false })),
    ]);
    setMcqOptions(options);
    setMcqAnswered(false);
    setMcqSelectedIndex(null);
  }, []);

  const startTest = useCallback((
    count: TestCount,
    mode: TestMode,
    format: TestFormat,
    options?: { selectedDates?: string[]; selectedGroupIds?: string[] }
  ) => {
    let filtered: FlashcardWord[];

    if (format === 'date' && options?.selectedDates && options.selectedDates.length > 0) {
      const dateSet = new Set(options.selectedDates);
      filtered = allWords.filter(w => {
        const wordDate = new Date(w.created_at).toISOString().split('T')[0];
        return dateSet.has(wordDate);
      });
    } else if (format === 'group' && options?.selectedGroupIds && options.selectedGroupIds.length > 0) {
      const groupSet = new Set(options.selectedGroupIds);
      filtered = allWords.filter(w => w.group_id && groupSet.has(w.group_id));
    } else if (format === 'difficult') {
      filtered = allWords.filter(w => w.is_difficult);
    } else {
      filtered = shuffleArray(allWords);
    }

    if (filtered.length === 0) filtered = shuffleArray(allWords);
    const limit = count === 'all' ? filtered.length : Math.min(count, filtered.length);
    const selected = shuffleArray(filtered).slice(0, limit);

    setCards(selected);
    setTotalTestCards(selected.length);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTestStarted(true);
    setTestFinished(false);
    setResults([]);
    setTestMode(mode);
    setTypingAnswer('');
    setTypingSubmitted(false);

    if (mode === 'mcq' && selected.length > 0) {
      generateMCQOptions(selected[0], allWords);
    }
  }, [allWords, generateMCQOptions]);

  const currentCard = cards[currentIndex] || null;

  const flipCard = useCallback(() => {
    setIsFlipped(prev => !prev);
  }, []);

  const advanceToNext = useCallback((nextIdx: number) => {
    if (nextIdx >= cards.length) {
      setTestFinished(true);
    } else {
      setCurrentIndex(nextIdx);
      setIsFlipped(false);
      setTypingAnswer('');
      setTypingSubmitted(false);
      if (testMode === 'mcq') {
        generateMCQOptions(cards[nextIdx], allWords);
      }
    }
  }, [cards, testMode, allWords, generateMCQOptions]);

  const rateCard = useCallback(async (quality: number) => {
    if (!user || !currentCard) return;

    const { easeFactor, intervalDays, repetitions, nextReviewAt } = calculateNextReview(
      quality, currentCard.ease_factor, currentCard.interval_days, currentCard.repetitions
    );

    const updateData = {
      ease_factor: easeFactor,
      interval_days: intervalDays,
      repetitions,
      next_review_at: nextReviewAt.toISOString(),
    };

    // Update in background — queue if offline
    if (isOnline) {
      supabase
        .from('vocabulary')
        .update(updateData)
        .eq('id', currentCard.id)
        .eq('user_id', user.id)
        .then(() => {});
    } else {
      addPendingAction({
        type: 'update',
        table: 'vocabulary',
        data: { id: currentCard.id, updates: updateData },
      });
    }

    setResults(prev => [...prev, {
      wordId: currentCard.id,
      word: currentCard.word,
      meanings: currentCard.meanings,
      quality,
    }]);

    advanceToNext(currentIndex + 1);
  }, [user, currentCard, currentIndex, isOnline, advanceToNext]);

  const answerMCQ = useCallback((optionIndex: number) => {
    if (mcqAnswered) return;
    setMcqAnswered(true);
    setMcqSelectedIndex(optionIndex);
    const isCorrect = mcqOptions[optionIndex]?.isCorrect;

    setTimeout(() => {
      rateCard(isCorrect ? 4 : 1);
    }, 1000);
  }, [mcqAnswered, mcqOptions, rateCard]);

  const submitTypingAnswer = useCallback(() => {
    if (typingSubmitted || !currentCard) return;
    setTypingSubmitted(true);
    const correct = currentCard.meanings.trim().toLowerCase();
    const answer = typingAnswer.trim().toLowerCase();
    const isCorrect = correct === answer || correct.includes(answer) || answer.includes(correct);

    setTimeout(() => {
      rateCard(isCorrect ? 4 : 1);
    }, 1200);

    return isCorrect;
  }, [typingSubmitted, currentCard, typingAnswer, rateCard]);

  const resetTest = useCallback(() => {
    setTestStarted(false);
    setTestFinished(false);
    setCards([]);
    setResults([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    setTypingAnswer('');
    setTypingSubmitted(false);
    fetchAllWords();
  }, [fetchAllWords]);

  const completedCount = results.length;
  const progress = totalTestCards > 0 ? (completedCount / totalTestCards) * 100 : 0;

  return {
    allWords,
    currentCard,
    isFlipped,
    isLoading,
    totalTestCards,
    remaining: totalTestCards - completedCount,
    completedCount,
    progress,
    testStarted,
    testFinished,
    testMode,
    results,
    mcqOptions,
    mcqAnswered,
    mcqSelectedIndex,
    typingAnswer,
    setTypingAnswer,
    typingSubmitted,
    submitTypingAnswer,
    flipCard,
    rateCard,
    answerMCQ,
    startTest,
    resetTest,
    refetch: fetchAllWords,
  };
}
