import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Calendar, Hash, Trash2, Pencil, Check, X, FolderInput, AlertTriangle, FolderMinus } from 'lucide-react';
import { format } from 'date-fns';
import { VocabularyWord } from '@/hooks/useVocabulary';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useLanguage } from '@/contexts/LanguageContext';
import { VocabularyLogo } from './VocabularyLogo';
import { VocabularyGroup } from '@/hooks/useVocabularyGroups';

interface VocabularyCardProps {
  word: VocabularyWord;
  index: number;
  onDelete: (id: string) => void;
  onEdit?: (id: string, word: string, meanings: string, notes: string | null) => void;
  groups?: VocabularyGroup[];
  onMoveToGroup?: (wordId: string, groupId: string | null) => void;
  onToggleDifficult?: (wordId: string, isDifficult: boolean) => void;
  /** Hide "leave group" when we're in main view */
  inGroupView?: boolean;
}

export function VocabularyCard({
  word, index, onDelete, onEdit,
  groups = [], onMoveToGroup, onToggleDifficult, inGroupView = false,
}: VocabularyCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editWord, setEditWord] = useState(word.word);
  const [editMeanings, setEditMeanings] = useState(word.meanings);
  const [editNotes, setEditNotes] = useState(word.notes || '');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const { t } = useLanguage();

  const isDifficult = !!word.is_difficult;

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

  // Glassy header gradient — turquoise normally, red when difficult
  const headerGradient = isDifficult
    ? 'linear-gradient(135deg, hsl(0 75% 60% / 0.85), hsl(0 65% 48% / 0.7))'
    : 'linear-gradient(135deg, hsl(174 72% 56% / 0.85), hsl(186 90% 42% / 0.7))';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.03, 0.2) }}
      className="relative bg-card rounded-[2rem] overflow-hidden shadow-card gpu border border-border/40"
    >
      {/* Glassy header */}
      <div
        className="relative p-4 flex items-center justify-between"
        style={{
          background: headerGradient,
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid hsl(0 0% 100% / 0.2)',
        }}
      >
        {/* Glass shine overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(180deg, hsl(0 0% 100% / 0.25), transparent 60%)',
          }}
        />

        {/* Logo circle (top-left) */}
        <div className="relative h-12 w-12 rounded-full flex items-center justify-center"
             style={{
               background: 'hsl(0 0% 100% / 0.25)',
               backdropFilter: 'blur(6px)',
               border: '1px solid hsl(0 0% 100% / 0.4)',
               boxShadow: 'inset 0 1px 0 hsl(0 0% 100% / 0.5)',
             }}>
          <VocabularyLogo size={32} />
        </div>

        {/* Action buttons */}
        <div className="relative flex items-center gap-1">
          <button onClick={speakWord}
                  className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                  aria-label="Pronounce">
            <Volume2 className="h-4.5 w-4.5" />
          </button>

          {onToggleDifficult && (
            <button onClick={() => onToggleDifficult(word.id, !isDifficult)}
                    className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                    aria-label={isDifficult ? 'Remove difficult' : 'Mark as difficult'}
                    title={isDifficult ? 'Remove from difficult' : 'Add to difficult'}>
              <AlertTriangle className="h-4.5 w-4.5" />
            </button>
          )}

          {onMoveToGroup && (
            inGroupView ? (
              <button onClick={() => onMoveToGroup(word.id, null)}
                      className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                      aria-label="Leave group" title="Leave group">
                <FolderMinus className="h-4.5 w-4.5" />
              </button>
            ) : (
              <div className="relative">
                <button onClick={() => setShowGroupMenu(v => !v)}
                        className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                        aria-label="Add to group" title="Add to group">
                  <FolderInput className="h-4.5 w-4.5" />
                </button>
                <AnimatePresence>
                  {showGroupMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowGroupMenu(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-0 mt-1 z-50 min-w-[180px] rounded-2xl border border-border bg-popover shadow-lg p-1 max-h-64 overflow-auto"
                      >
                        {groups.length === 0 ? (
                          <p className="px-3 py-2 text-xs text-muted-foreground">No groups yet</p>
                        ) : groups.map(g => (
                          <button key={g.id}
                                  onClick={() => { onMoveToGroup(word.id, g.id); setShowGroupMenu(false); }}
                                  className="w-full text-left px-3 py-2 rounded-xl text-sm text-foreground hover:bg-accent transition-colors">
                            {g.name}
                          </button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
          )}

          <button onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                  className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                  aria-label={isEditing ? 'Save' : 'Edit'}>
            {isEditing ? <Check className="h-4.5 w-4.5" /> : <Pencil className="h-4.5 w-4.5" />}
          </button>

          {isEditing ? (
            <button onClick={handleCancel}
                    className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                    aria-label="Cancel">
              <X className="h-4.5 w-4.5" />
            </button>
          ) : (
            <button onClick={() => onDelete(word.id)}
                    className="p-2 rounded-xl text-white/85 hover:text-white hover:bg-white/15 transition-colors active:scale-[0.95]"
                    aria-label="Delete">
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        <span className="text-[10px] font-bold text-primary uppercase tracking-[0.15em]">{t('english')}</span>

        {isEditing ? (
          <div className="space-y-3">
            <Input value={editWord} onChange={e => setEditWord(e.target.value)} className="rounded-xl text-lg font-bold" />
            <Input value={editMeanings} onChange={e => setEditMeanings(e.target.value)} className="rounded-xl" placeholder={t('meaningLabel')} />
            <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="rounded-xl min-h-[60px]" placeholder={t('notesOptional')} />
          </div>
        ) : (
          <>
            <h3 className="text-3xl font-extrabold text-primary text-center leading-tight tracking-tight">{word.word}</h3>
            <div className="pt-2">
              <span className="text-[10px] font-bold text-destructive uppercase tracking-[0.15em]">{t('targetLanguage')}</span>
              <p className="text-lg text-destructive font-medium mt-1" dir="auto">{word.meanings}</p>
            </div>
            {word.notes && <p className="text-sm text-muted-foreground italic" dir="auto">{word.notes}</p>}
          </>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-border/60">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Hash className="h-3 w-3" />
            <span>{letterCount} {t('letters')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
