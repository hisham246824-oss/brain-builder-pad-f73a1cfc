import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { AddWordResult } from '@/hooks/useVocabulary';

interface AddWordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (word: string, meanings: string, notes?: string) => Promise<AddWordResult>;
  onJumpToWord?: (wordId: string) => void;
}

export function AddWordDialog({ isOpen, onClose, onAdd, onJumpToWord }: AddWordDialogProps) {
  const [word, setWord] = useState('');
  const [meanings, setMeanings] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateId, setDuplicateId] = useState<string | null>(null);
  const { t, isRTL } = useLanguage();

  const reset = () => {
    setWord(''); setMeanings(''); setNotes(''); setDuplicateId(null);
  };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meanings.trim()) return;

    setIsSubmitting(true);
    setDuplicateId(null);
    const result = await onAdd(word, meanings, notes || undefined);
    setIsSubmitting(false);

    if ('duplicate' in result && result.duplicate) {
      setDuplicateId(result.existing.id);
      return;
    }
    if ('error' in result) return;

    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.14 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="rounded-3xl bg-card p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">
                  {t('addNewWord')}
                </h2>
                <button onClick={handleClose}
                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    {t('englishWord')}
                  </label>
                  <Input
                    value={word}
                    onChange={(e) => { setWord(e.target.value); if (duplicateId) setDuplicateId(null); }}
                    placeholder={t('enterEnglishWord')}
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                {duplicateId && (
                  <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-destructive">
                        {t('wordAlreadyExists') || 'This word is already in your vocabulary.'}
                      </p>
                      {onJumpToWord && (
                        <button
                          type="button"
                          onClick={() => { onJumpToWord(duplicateId); handleClose(); }}
                          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                        >
                          {t('goToWord') || 'Go to word'}
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    {t('meaningLabel')}
                  </label>
                  <Input
                    value={meanings}
                    onChange={(e) => setMeanings(e.target.value)}
                    placeholder={t('enterMeaning')}
                    className={`rounded-xl ${isRTL ? '' : ''}`}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">
                    {t('notesOptional')}
                  </label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('addNotes')}
                    className="rounded-xl min-h-[80px]"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!word.trim() || !meanings.trim() || isSubmitting}
                  className="w-full rounded-2xl py-6 text-lg font-medium"
                >
                  {isSubmitting ? t('adding') : t('addWord')}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
