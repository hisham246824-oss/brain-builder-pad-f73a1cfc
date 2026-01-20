import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { AddWordDialog } from '@/components/vocabulary/AddWordDialog';
import { VocabularySkeleton } from '@/components/skeletons/VocabularySkeleton';
import { useVocabulary } from '@/hooks/useVocabulary';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function VocabularyPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { words, isLoading, searchQuery, setSearchQuery, addWord, deleteWord } = useVocabulary();
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Sign in to use Vocabulary
        </h3>
        <p className="text-muted-foreground">
          Create an account to save and sync your vocabulary words
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <VocabularySkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Vocabulary</h1>
        <p className="mt-1 text-muted-foreground">
          {words.length} {words.length === 1 ? 'word' : 'words'}
        </p>
      </div>

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

      <div className="flex gap-3 mb-6">
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="flex-1 rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Word
        </Button>
        <Link to="/flashcards">
          <Button
            variant="outline"
            className="rounded-2xl py-6 px-6 text-lg font-medium"
          >
            <GraduationCap className="mr-2 h-5 w-5" />
            Practice
          </Button>
        </Link>
      </div>

      {words.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {searchQuery ? 'No words found' : 'No words yet'}
          </h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try a different search term' : 'Add your first vocabulary word to get started'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {words.map((word, index) => (
              <VocabularyCard
                key={word.id}
                word={word}
                index={index}
                onDelete={deleteWord}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddWordDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={addWord}
      />
    </motion.div>
  );
}
