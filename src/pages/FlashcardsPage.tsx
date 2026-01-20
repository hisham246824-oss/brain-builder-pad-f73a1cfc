import { useFlashcards } from '@/hooks/useFlashcards';
import { Flashcard } from '@/components/vocabulary/Flashcard';
import { FlashcardControls } from '@/components/vocabulary/FlashcardControls';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, RefreshCw, CheckCircle2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function FlashcardsPage() {
  const { user } = useAuth();
  const { currentCard, isFlipped, isLoading, totalDue, remaining, flipCard, rateCard, refetch } = useFlashcards();

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
      <div className="flex items-center justify-between mb-8">
        <Link to="/vocabulary">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="text-sm text-muted-foreground">
          {remaining} / {totalDue} cards remaining
        </div>
        <Button variant="ghost" size="icon" onClick={refetch}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : currentCard ? (
        <motion.div
          key={currentCard.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <Flashcard card={currentCard} isFlipped={isFlipped} onFlip={flipCard} />
          {isFlipped && <FlashcardControls onRate={rateCard} disabled={!isFlipped} />}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-64 text-center"
        >
          <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">All done!</h2>
          <p className="text-muted-foreground mb-4">
            No cards due for review. Check back later!
          </p>
          <Link to="/vocabulary">
            <Button>Add more words</Button>
          </Link>
        </motion.div>
      )}

      {/* Progress bar */}
      {totalDue > 0 && (
        <div className="mt-8">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${((totalDue - remaining) / totalDue) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
