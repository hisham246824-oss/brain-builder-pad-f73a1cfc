import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';

interface AddWordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (word: string, meanings: string, notes?: string) => Promise<any>;
}

export function AddWordDialog({ isOpen, onClose, onAdd }: AddWordDialogProps) {
  const [word, setWord] = useState('');
  const [meanings, setMeanings] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!word.trim() || !meanings.trim()) return;

    setIsSubmitting(true);
    await onAdd(word, meanings, notes || undefined);
    setWord('');
    setMeanings('');
    setNotes('');
    setIsSubmitting(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">
                  {t('addNewWord')}
                </h2>
                <button
                  onClick={onClose}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
                >
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
                    onChange={(e) => setWord(e.target.value)}
                    placeholder={t('enterEnglishWord')}
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

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
