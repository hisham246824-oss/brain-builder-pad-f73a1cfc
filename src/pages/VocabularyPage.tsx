import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, GraduationCap, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { AddWordDialog } from '@/components/vocabulary/AddWordDialog';
import { VocabularySkeleton } from '@/components/skeletons/VocabularySkeleton';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function VocabularyPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDifficult, setShowDifficult] = useState(false);
  const { words, allWords, isLoading, searchQuery, setSearchQuery, addWord, deleteWord, refetch } = useVocabulary();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [masteredCount, setMasteredCount] = useState(0);
  const [difficultWords, setDifficultWords] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data } = await supabase
        .from('vocabulary')
        .select('id, word, meanings, notes, created_at, ease_factor, repetitions')
        .eq('user_id', user.id);
      if (data) {
        setMasteredCount(data.filter(w => Number(w.ease_factor) >= 2.5 && (w.repetitions || 0) >= 3).length);
        setDifficultWords(data.filter(w => Number(w.ease_factor) < 2.0 && (w.repetitions || 0) >= 1));
      }
    };
    fetchStats();
  }, [user, allWords]);

  const editWord = async (id: string, word: string, meanings: string, notes: string | null) => {
    if (!user) return;
    await supabase.from('vocabulary').update({ word, meanings, notes }).eq('id', id).eq('user_id', user.id);
    refetch();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">{t('signInToUse')} {t('vocabulary')}</h3>
      </div>
    );
  }

  if (isLoading) return <VocabularySkeleton />;

  const totalWords = allWords.length;
  const masteryPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const displayWords = showDifficult ? difficultWords : words;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.166, ease: [0.22, 1, 0.36, 1] }} className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary">{t('vocabulary')}</h1>
        <p className="mt-1 text-muted-foreground">
          {totalWords} {t('words')} · {masteredCount} {t('mastered')}
        </p>
      </div>

      {totalWords > 0 && (
        <div className="mb-6 bg-card rounded-2xl p-4 border border-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t('masteryProgress')}</span>
            <span className="font-semibold text-primary">{masteryPercent}%</span>
          </div>
          <Progress value={masteryPercent} className="h-2" />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('search')} className="pl-12 rounded-2xl py-6" />
      </div>

      {/* Add Word - full width */}
      <Button onClick={() => setIsDialogOpen(true)} className="w-full rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow mb-3">
        <Plus className="mr-2 h-5 w-5" />
        {t('addWord')}
      </Button>

      {/* Difficult + Practice - equal width row */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Button
          variant={showDifficult ? 'default' : 'outline'}
          onClick={() => setShowDifficult(!showDifficult)}
          className={`rounded-2xl py-6 text-sm font-medium ${showDifficult ? 'bg-destructive hover:bg-destructive/90' : ''}`}
        >
          <AlertTriangle className="mr-1 h-4 w-4" />
          {t('difficult')} ({difficultWords.length})
        </Button>
        <Link to="/flashcards" className="w-full">
          <Button variant="outline" className="w-full rounded-2xl py-6 text-sm font-medium">
            <GraduationCap className="mr-2 h-5 w-5" />
            {t('practice')}
          </Button>
        </Link>
      </div>

      {showDifficult && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-sm text-destructive">
          {t('showingDifficult')} ({difficultWords.length})
        </div>
      )}

      {displayWords.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {showDifficult ? t('noDifficultWords') : searchQuery ? t('noWordsFound') : t('noWordsYet')}
          </h3>
          <p className="text-muted-foreground">
            {showDifficult ? t('greatNoDifficult') : searchQuery ? t('tryDifferentSearch') : t('addFirstWord')}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {displayWords.map((word, index) => (
              <VocabularyCard key={word.id} word={word} index={index} onDelete={deleteWord} onEdit={editWord} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddWordDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onAdd={addWord} />
    </motion.div>
  );
}
