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
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function VocabularyPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showDifficult, setShowDifficult] = useState(false);
  const { words, allWords, isLoading, searchQuery, setSearchQuery, addWord, deleteWord, refetch } = useVocabulary();
  const { user } = useAuth();
  const [masteredCount, setMasteredCount] = useState(0);
  const [difficultWords, setDifficultWords] = useState<any[]>([]);

  // Fetch mastery & difficult words stats
  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const { data } = await supabase
        .from('vocabulary')
        .select('id, word, meanings, notes, created_at, ease_factor, repetitions')
        .eq('user_id', user.id);
      if (data) {
        // Mastered: ease_factor >= 2.5 and repetitions >= 3
        setMasteredCount(data.filter(w => Number(w.ease_factor) >= 2.5 && (w.repetitions || 0) >= 3).length);
        // Difficult: ease_factor < 2.0 or failed (repetitions <= 1 and has been tested)
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
        <h3 className="mb-2 text-lg font-semibold text-foreground">Sign in to use Vocabulary</h3>
        <p className="text-muted-foreground">Create an account to save and sync your vocabulary words</p>
      </div>
    );
  }

  if (isLoading) return <VocabularySkeleton />;

  const totalWords = allWords.length;
  const masteryPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;
  const displayWords = showDifficult ? difficultWords : words;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Vocabulary</h1>
        <p className="mt-1 text-muted-foreground">
          {totalWords} {totalWords === 1 ? 'word' : 'words'} · {masteredCount} mastered
        </p>
      </div>

      {/* Mastery Progress */}
      {totalWords > 0 && (
        <div className="mb-6 bg-card rounded-2xl p-4 border border-border">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Mastery Progress</span>
            <span className="font-semibold text-primary">{masteryPercent}%</span>
          </div>
          <Progress value={masteryPercent} className="h-2" />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search in English or Arabic..."
          className="pl-12 rounded-2xl py-6"
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex-1 rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Word
        </Button>
        <Button
          variant={showDifficult ? 'default' : 'outline'}
          onClick={() => setShowDifficult(!showDifficult)}
          className={`rounded-2xl py-6 px-4 text-sm font-medium ${showDifficult ? 'bg-destructive hover:bg-destructive/90' : ''}`}
        >
          <AlertTriangle className="mr-1 h-4 w-4" />
          Difficult ({difficultWords.length})
        </Button>
        <Link to="/flashcards">
          <Button variant="outline" className="rounded-2xl py-6 px-6 text-lg font-medium">
            <GraduationCap className="mr-2 h-5 w-5" />
            Practice
          </Button>
        </Link>
      </div>

      {showDifficult && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-sm text-destructive">
          Showing {difficultWords.length} difficult words that need more review
        </div>
      )}

      {displayWords.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {showDifficult ? 'No difficult words' : searchQuery ? 'No words found' : 'No words yet'}
          </h3>
          <p className="text-muted-foreground">
            {showDifficult ? 'Great! No words are marked as difficult' : searchQuery ? 'Try a different search term' : 'Add your first vocabulary word to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {displayWords.map((word, index) => (
              <VocabularyCard
                key={word.id}
                word={word}
                index={index}
                onDelete={deleteWord}
                onEdit={editWord}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddWordDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onAdd={addWord} />
    </motion.div>
  );
}
