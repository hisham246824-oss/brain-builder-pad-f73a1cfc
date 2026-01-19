import { motion } from 'framer-motion';
import { BookOpen, Volume2, Star, Calendar, Hash, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { VocabularyWord } from '@/hooks/useVocabulary';

interface VocabularyCardProps {
  word: VocabularyWord;
  index: number;
  onDelete: (id: string) => void;
}

export function VocabularyCard({ word, index, onDelete }: VocabularyCardProps) {
  const speakWord = () => {
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const formattedDate = format(new Date(word.created_at), 'MMM dd, yyyy');
  const letterCount = word.word.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-lg transition-shadow group"
    >
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <BookOpen className="h-6 w-6 text-primary-foreground" />
        </div>
        <button 
          className="text-primary-foreground/70 hover:text-primary-foreground transition-colors"
          aria-label="Favorite"
        >
          <Star className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* English Label */}
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">
          ENGLISH
        </span>

        {/* Word with Speaker */}
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-card-foreground">
            {word.word}
          </h3>
          <button
            onClick={speakWord}
            className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            aria-label="Pronounce word"
          >
            <Volume2 className="h-5 w-5" />
          </button>
        </div>

        {/* Arabic Label */}
        <span className="text-xs font-semibold text-destructive">
          العربية
        </span>

        {/* Meaning */}
        <p className="text-lg text-destructive font-medium text-right" dir="rtl">
          {word.meanings}
        </p>

        {/* Notes if any */}
        {word.notes && (
          <p className="text-sm text-muted-foreground" dir="auto">
            {word.notes}
          </p>
        )}

        {/* Metadata Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>{letterCount} letters</span>
          </div>
        </div>
      </div>

      {/* Delete button (appears on hover) */}
      <button
        onClick={() => onDelete(word.id)}
        className="absolute top-4 right-12 opacity-0 group-hover:opacity-100 p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all"
        aria-label="Delete word"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
