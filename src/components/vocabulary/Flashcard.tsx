import { motion } from 'framer-motion';
import { Volume2, BookOpen } from 'lucide-react';
import { FlashcardWord } from '@/hooks/useFlashcards';

interface FlashcardProps {
  card: FlashcardWord;
  isFlipped: boolean;
  onFlip: () => void;
}

export function Flashcard({ card, isFlipped, onFlip }: FlashcardProps) {
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="perspective-1000 w-full max-w-md mx-auto">
      <motion.div
        className="relative w-full h-64 cursor-pointer"
        onClick={onFlip}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
      >
        {/* Front - Word */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl bg-card border-2 border-primary/20 shadow-lg flex flex-col items-center justify-center p-6 backface-hidden"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <BookOpen className="h-8 w-8 text-primary/40 mb-4" />
          <h2 className="text-3xl font-bold text-foreground mb-2">{card.word}</h2>
          <button
            onClick={(e) => {
              e.stopPropagation();
              speak(card.word);
            }}
            className="p-2 rounded-full hover:bg-primary/10 transition-colors"
          >
            <Volume2 className="h-5 w-5 text-primary" />
          </button>
          <p className="text-muted-foreground text-sm mt-4">Tap to reveal meaning</p>
        </div>

        {/* Back - Meaning */}
        <div
          className="absolute inset-0 w-full h-full rounded-3xl bg-card border-2 border-primary/20 shadow-lg flex flex-col items-center justify-center p-6"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
        >
          <p className="text-2xl font-semibold text-destructive text-center mb-2" dir="rtl">
            {card.meanings}
          </p>
          {card.notes && (
            <p className="text-muted-foreground text-sm text-center mt-2">
              {card.notes}
            </p>
          )}
          <p className="text-muted-foreground text-sm mt-4">Rate your recall below</p>
        </div>
      </motion.div>
    </div>
  );
}
