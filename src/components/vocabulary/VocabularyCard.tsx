import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Volume2, Calendar, Hash, Trash2, Pencil, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface VocabularyCardProps {
  word: VocabularyWord;
  index: number;
  onDelete: (id: string) => void;
  onEdit?: (id: string, word: string, meanings: string, notes: string | null) => void;
}

export function VocabularyCard({ word, index, onDelete, onEdit }: VocabularyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editWord, setEditWord] = useState(word.word);
  const [editMeanings, setEditMeanings] = useState(word.meanings);
  const [editNotes, setEditNotes] = useState(word.notes || '');

  const speakWord = () => {
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const handleSave = () => {
    if (onEdit && editWord.trim() && editMeanings.trim()) {
      onEdit(word.id, editWord.trim(), editMeanings.trim(), editNotes.trim() || null);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditWord(word.word);
    setEditMeanings(word.meanings);
    setEditNotes(word.notes || '');
    setIsEditing(false);
  };

  const formattedDate = format(new Date(word.created_at), 'MMM dd, yyyy');
  const letterCount = word.word.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
      className="relative bg-card rounded-3xl overflow-hidden shadow-card hover:shadow-lg transition-shadow"
    >
      {/* Header with action buttons */}
      <div className="bg-gradient-to-r from-primary to-primary/80 p-4 flex items-center justify-between">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
          <BookOpen className="h-6 w-6 text-primary-foreground" />
        </div>
        {/* All buttons horizontal */}
        <div className="flex items-center gap-1">
          <button
            onClick={speakWord}
            className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
            aria-label="Pronounce word"
          >
            <Volume2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
            aria-label={isEditing ? "Save" : "Edit word"}
          >
            {isEditing ? <Check className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
          </button>
          {isEditing ? (
            <button
              onClick={handleCancel}
              className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
              aria-label="Cancel"
            >
              <X className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => onDelete(word.id)}
              className="p-2 rounded-lg text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 transition-colors"
              aria-label="Delete word"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <span className="text-xs font-semibold text-primary uppercase tracking-wider">ENGLISH</span>

        {isEditing ? (
          <div className="space-y-3">
            <Input value={editWord} onChange={e => setEditWord(e.target.value)} className="rounded-xl text-lg font-bold" />
            <Input value={editMeanings} onChange={e => setEditMeanings(e.target.value)} className="rounded-xl text-right" dir="rtl" placeholder="المعنى" />
            <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="rounded-xl min-h-[60px]" placeholder="Notes (optional)" />
          </div>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-primary text-center">{word.word}</h3>
            <span className="text-xs font-semibold text-destructive">العربية</span>
            <p className="text-lg text-destructive font-medium text-right" dir="rtl">{word.meanings}</p>
            {word.notes && <p className="text-sm text-muted-foreground" dir="auto">{word.notes}</p>}
          </>
        )}

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
    </motion.div>
  );
}
