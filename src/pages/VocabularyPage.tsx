import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Pencil, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface VocabularyWord {
  id: string;
  word: string;
  meanings: string;
  notes: string | null;
  created_at: string;
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

  // Add word mutation
  const addWordMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase.from('vocabulary').insert({
        user_id: user.id,
        word: newWord.trim(),
        meanings: newMeanings.trim(),
        notes: newNotes.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vocabulary'] });
      setNewWord('');
      setNewMeanings('');
      setNewNotes('');
      setIsAddingWord(false);
      toast.success('Word added successfully');
    },
    onError: () => toast.error('Failed to add word'),
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
    if (!newWord.trim() || !newMeanings.trim()) {
      toast.error('Please enter both word and meanings');
      return;
    }
    addWordMutation.mutate();
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
        className="max-w-2xl mx-auto"
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
                      {addWordMutation.isPending ? 'Adding...' : 'Add Word'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Vocabulary Cards */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredVocabulary.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-3xl p-5 shadow-md hover:shadow-lg transition-shadow group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-foreground mb-2">{item.word}</h3>
                      <p className="text-destructive font-medium text-lg" dir="rtl">
                        {item.meanings}
                      </p>
                      {item.notes && (
                        <p className="text-destructive/70 text-sm mt-2" dir="auto">
                          {item.notes}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteWordMutation.mutate(item.id)}
                      className="p-2 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {filteredVocabulary.length === 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                {searchQuery ? 'No words found matching your search' : 'No words added yet. Start building your vocabulary!'}
              </motion.div>
            )}
        </div>
      </motion.div>
    </div>
  );
}
