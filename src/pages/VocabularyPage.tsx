import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, X, Trash2, BookOpen, Volume2, Star, Calendar, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface VocabularyWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  created_at: string;
}

interface AddWordData {
  word: string;
  meanings: string;
  notes: string | null;
}

export default function VocabularyPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingWord, setIsAddingWord] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [newMeanings, setNewMeanings] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Fetch vocabulary
  const { data: vocabulary = [] } = useQuery({
    queryKey: ['vocabulary', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('vocabulary')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VocabularyWord[];
    },
    enabled: !!user,
  });

  // Add word mutation - pass data directly to avoid closure issues
  const addWordMutation = useMutation({
    mutationFn: async (wordData: AddWordData) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('vocabulary').insert({
        user_id: user.id,
        word: wordData.word,
        meanings: wordData.meanings,
        notes: wordData.notes,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onMutate: async (wordData: AddWordData) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['vocabulary', user?.id] });
      
      // Snapshot the previous value
      const previousVocabulary = queryClient.getQueryData(['vocabulary', user?.id]);
      
      // Optimistically update with the passed data
      const optimisticWord: VocabularyWord = {
        id: `temp-${Date.now()}`,
        word: wordData.word,
        meanings: wordData.meanings,
        notes: wordData.notes,
        created_at: new Date().toISOString(),
      };
      
      queryClient.setQueryData(['vocabulary', user?.id], (old: VocabularyWord[] = []) => [
        optimisticWord,
        ...old,
      ]);
      
      return { previousVocabulary };
    },
    onError: (err, _, context) => {
      // Rollback on error
      queryClient.setQueryData(['vocabulary', user?.id], context?.previousVocabulary);
      toast.error('Failed to add word');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary', user?.id] });
      toast.success('Word added!');
    },
  });

  // Delete word mutation
  const deleteWordMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('vocabulary').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      toast.success('Word deleted');
    },
    onError: () => toast.error('Failed to delete word'),
  });

  // Filter vocabulary based on search
  const filteredVocabulary = useMemo(() => {
    if (!searchQuery.trim()) return vocabulary;
    const query = searchQuery.toLowerCase();
    return vocabulary.filter(
      (item) =>
        item.word.toLowerCase().includes(query) ||
        item.meanings.toLowerCase().includes(query)
    );
  }, [vocabulary, searchQuery]);

  const handleAddWord = () => {
    const word = newWord.trim();
    const meanings = newMeanings.trim();
    const notes = newNotes.trim() || null;

    if (!word || !meanings) {
      toast.error('Please enter both word and meanings');
      return;
    }

    // Pass data directly to mutation
    addWordMutation.mutate({ word, meanings, notes });
    
    // Clear form after passing data
    setNewWord('');
    setNewMeanings('');
    setNewNotes('');
    setIsAddingWord(false);
  };

  const speakWord = (word: string) => {
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to access your vocabulary.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Vocabulary</h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <div className="flex items-center bg-card border border-border rounded-full px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
              dir="auto"
            />
            <Pencil className="h-5 w-5 text-muted-foreground ml-3 flex-shrink-0" />
          </div>
        </div>

        {/* Add Word Button */}
        <motion.div className="mb-6">
          <AnimatePresence mode="wait">
            {!isAddingWord ? (
              <motion.div
                key="button"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Button
                  onClick={() => setIsAddingWord(true)}
                  className="w-full rounded-2xl py-6 text-lg font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add New Word
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-card border border-border rounded-3xl p-5 shadow-lg"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">Add New Word</h3>
                  <button
                    onClick={() => setIsAddingWord(false)}
                    className="p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </div>
                <div className="space-y-4">
                  <Input
                    placeholder="English Word"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    className="rounded-xl"
                    autoFocus
                  />
                  <Textarea
                    placeholder="Arabic Meanings (المعاني)"
                    value={newMeanings}
                    onChange={(e) => setNewMeanings(e.target.value)}
                    className="rounded-xl min-h-[80px]"
                    dir="rtl"
                  />
                  <Textarea
                    placeholder="Notes (optional - ملاحظات)"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="rounded-xl min-h-[60px]"
                    dir="auto"
                  />
                  <Button
                    onClick={handleAddWord}
                    disabled={addWordMutation.isPending}
                    className="w-full rounded-xl py-5"
                  >
                    Done
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Vocabulary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filteredVocabulary.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ delay: index * 0.03 }}
                className="bg-card border border-border rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow group relative"
              >
                {/* Star Icon */}
                <button className="absolute top-4 right-4 text-muted-foreground/50 hover:text-amber-400 transition-colors">
                  <Star className="h-5 w-5" />
                </button>

                {/* Book Icon */}
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mb-4">
                  <BookOpen className="h-6 w-6 text-primary-foreground" />
                </div>

                {/* English Section */}
                <div className="mb-3">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">English</span>
                  <div className="flex items-center justify-between mt-1">
                    <h3 className="text-2xl font-bold text-foreground">{item.word || '—'}</h3>
                    <button 
                      onClick={() => speakWord(item.word)}
                      className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Volume2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Separator */}
                <div className="border-t border-border my-3" />

                {/* Arabic Section */}
                <div className="mb-4">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">العربية</span>
                  <p className="text-lg text-foreground mt-1 text-right" dir="rtl">
                    {item.meanings || '—'}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mt-2 text-right" dir="rtl">
                      {item.notes}
                    </p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Hash className="h-3.5 w-3.5" />
                      <span>{item.word?.length || 0} letters</span>
                    </div>
                    <button
                      onClick={() => deleteWordMutation.mutate(item.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredVocabulary.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            {searchQuery ? 'No words found matching your search' : 'No words added yet. Start building your vocabulary!'}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
