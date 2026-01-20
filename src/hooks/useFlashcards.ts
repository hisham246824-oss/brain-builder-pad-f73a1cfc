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

// SM-2 Algorithm implementation
function calculateNextReview(
  quality: number, // 0-5 rating (0-2 = fail, 3-5 = pass)
  easeFactor: number,
  intervalDays: number,
  repetitions: number
): { easeFactor: number; intervalDays: number; repetitions: number; nextReviewAt: Date } {
  let newEaseFactor = easeFactor;
  let newIntervalDays = intervalDays;
  let newRepetitions = repetitions;

  if (quality < 3) {
    // Failed - reset
    newRepetitions = 0;
    newIntervalDays = 1;
  } else {
    // Passed
    if (newRepetitions === 0) {
      newIntervalDays = 1;
    } else if (newRepetitions === 1) {
      newIntervalDays = 6;
    } else {
      newIntervalDays = Math.round(intervalDays * easeFactor);
    }
    newRepetitions += 1;
  }

  // Update ease factor
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

export function useFlashcards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchDueCards = useCallback(async () => {
    if (!user) {
      setCards([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('vocabulary')
      .select('id, word, meanings, notes, ease_factor, interval_days, repetitions, next_review_at')
      .eq('user_id', user.id)
      .lte('next_review_at', now)
      .order('next_review_at', { ascending: true });

    if (error) {
      console.error('Error fetching flashcards:', error);
    } else {
      setCards((data || []).map(card => ({
        ...card,
        ease_factor: Number(card.ease_factor) || 2.5,
        interval_days: card.interval_days || 0,
        repetitions: card.repetitions || 0,
        next_review_at: card.next_review_at || now,
      })));
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchDueCards();
  }, [fetchDueCards]);

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

    // Update in database
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

    // Move to next card
    setCards(prev => prev.filter((_, i) => i !== currentIndex));
    setIsFlipped(false);
    
    if (currentIndex >= cards.length - 1) {
      setCurrentIndex(0);
    }
  }, [user, currentCard, currentIndex, cards.length]);

  const totalDue = cards.length;
  const remaining = cards.length - currentIndex;

  return {
    currentCard,
    isFlipped,
    isLoading,
    totalDue,
    remaining,
    flipCard,
    rateCard,
    refetch: fetchDueCards,
  };
}
