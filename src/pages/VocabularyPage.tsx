import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, GraduationCap, AlertTriangle, FolderOpen, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { VocabularyCard } from '@/components/vocabulary/VocabularyCard';
import { AddWordDialog } from '@/components/vocabulary/AddWordDialog';
import { CreateGroupDialog } from '@/components/vocabulary/CreateGroupDialog';
import { GroupCard } from '@/components/vocabulary/GroupCard';
import { VocabularyLogo } from '@/components/vocabulary/VocabularyLogo';
import { VocabularySkeleton } from '@/components/skeletons/VocabularySkeleton';
import { useVocabulary, VocabularyView } from '@/hooks/useVocabulary';
import { useVocabularyGroups } from '@/hooks/useVocabularyGroups';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Screen =
  | { kind: 'main' }
  | { kind: 'groups' }
  | { kind: 'group'; groupId: string; groupName: string };

export default function VocabularyPage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [screen, setScreen] = useState<Screen>({ kind: 'main' });
  const [isAddWordOpen, setAddWordOpen] = useState(false);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [showDifficult, setShowDifficult] = useState(false);
  const [groupSearch, setGroupSearch] = useState('');
  const [pendingDeleteGroup, setPendingDeleteGroup] = useState<{ id: string; name: string } | null>(null);

  const view: VocabularyView = useMemo(() => {
    if (screen.kind === 'main') return { type: 'main' };
    if (screen.kind === 'group') return { type: 'group', groupId: screen.groupId };
    return { type: 'all' };
  }, [screen]);

  const { words, allWords, isLoading, searchQuery, setSearchQuery, addWord, deleteWord, refetch } = useVocabulary(view);
  const { groups, createGroup, deleteGroup, moveWordToGroup, setWordDifficult } = useVocabularyGroups();

  const [masteredCount, setMasteredCount] = useState(0);
  const [difficultWords, setDifficultWords] = useState<any[]>([]);

  useEffect(() => {
    if (!user || !navigator.onLine) return;
    (async () => {
      const { data } = await supabase
        .from('vocabulary')
        .select('id, word, meanings, notes, created_at, ease_factor, repetitions, group_id, is_difficult')
        .eq('user_id', user.id);
      if (data) {
        setMasteredCount(data.filter(w => Number(w.ease_factor) >= 2.5 && (w.repetitions || 0) >= 3).length);
        setDifficultWords(
          data.filter(w => w.is_difficult || (Number(w.ease_factor) < 2.0 && (w.repetitions || 0) >= 1))
        );
      }
    })();
  }, [user, allWords]);

  const editWord = async (id: string, w: string, m: string, n: string | null) => {
    if (!user) return;
    await supabase.from('vocabulary').update({ word: w, meanings: m, notes: n }).eq('id', id).eq('user_id', user.id);
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

  // Total words on the entire page (general vocabulary only — words not in any group)
  const mainCount = allWords.filter(w => !w.group_id).length;
  const totalWords = allWords.length;
  const masteryPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  // What is shown as the main word grid:
  let displayWords: any[] = [];
  if (showDifficult) {
    displayWords = difficultWords;
  } else if (screen.kind === 'main' || screen.kind === 'group') {
    displayWords = words;
  }

  // Groups screen — filtered list
  const filteredGroups = groups.filter(g =>
    !groupSearch || g.name.toLowerCase().includes(groupSearch.toLowerCase())
  );

  // Header counts
  const headerCount = screen.kind === 'main'
    ? mainCount
    : screen.kind === 'group'
      ? words.length
      : groups.length;
  const headerCountLabel = screen.kind === 'groups'
    ? `${groups.length} ${groups.length === 1 ? 'group' : 'groups'}`
    : `${headerCount} ${t('words')}`;

  // Toggle button labels (Groups → Back to Groups → Back to Vocabulary)
  const toggleLabel =
    screen.kind === 'main' ? 'Groups'
    : screen.kind === 'groups' ? 'Back to Vocabulary'
    : 'Back to Groups';

  const handleToggle = () => {
    if (screen.kind === 'main') setScreen({ kind: 'groups' });
    else if (screen.kind === 'groups') setScreen({ kind: 'main' });
    else setScreen({ kind: 'groups' });
    setSearchQuery('');
    setGroupSearch('');
    setShowDifficult(false);
  };

  const searchPlaceholder =
    screen.kind === 'groups' ? 'Search groups…'
    : screen.kind === 'group' ? `Search in ${screen.groupName}…`
    : t('search');

  const titleLabel =
    screen.kind === 'groups' ? 'Vocabulary Groups'
    : screen.kind === 'group' ? screen.groupName
    : t('vocabulary');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} className="pb-20">
      {/* Header rectangle: title + count on left, glass turquoise circle + progress on right */}
      <div
        className="mb-6 rounded-[2rem] border border-border/50 p-5 sm:p-6"
        style={{
          background:
            'linear-gradient(135deg, hsl(var(--card) / 0.95), hsl(var(--card) / 0.75))',
          boxShadow: '0 4px 18px hsl(var(--foreground) / 0.04)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <div className="flex items-center gap-4 sm:gap-5">
          {/* Optional back arrow on group page */}
          {screen.kind === 'group' && (
            <button
              onClick={() => setScreen({ kind: 'groups' })}
              className="p-2 rounded-2xl hover:bg-secondary transition-colors active:scale-[0.95]"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-primary leading-tight truncate">
              {titleLabel}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {headerCountLabel}
              {screen.kind === 'main' && totalWords > 0 && (
                <> · {masteredCount} {t('mastered')}</>
              )}
            </p>
          </div>

          {/* Turquoise glassy circle with logo */}
          <div className="hidden sm:flex shrink-0">
            <div
              className="h-16 w-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(174 72% 56% / 0.95), hsl(186 90% 42% / 0.85))',
                boxShadow: '0 8px 22px hsl(174 72% 56% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
              }}
            >
              <VocabularyLogo size={42} />
            </div>
          </div>
        </div>

        {screen.kind === 'main' && totalWords > 0 && (
          <div className="mt-5">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground font-medium">{t('masteryProgress')}</span>
              <span className="font-semibold text-primary">{masteryPercent}%</span>
            </div>
            <Progress value={masteryPercent} className="h-2.5 rounded-full" />
          </div>
        )}

        {/* Mobile-only logo + circle line */}
        <div className="sm:hidden mt-4 flex items-center justify-center">
          <div
            className="h-14 w-14 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, hsl(174 72% 56% / 0.95), hsl(186 90% 42% / 0.85))',
              boxShadow: '0 8px 22px hsl(174 72% 56% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.5)',
            }}
          >
            <VocabularyLogo size={36} />
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={screen.kind === 'groups' ? groupSearch : searchQuery}
          onChange={(e) => screen.kind === 'groups' ? setGroupSearch(e.target.value) : setSearchQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-12 rounded-2xl py-6"
        />
      </div>

      {/* Primary action button: Add Word / Add Group */}
      {screen.kind === 'groups' ? (
        <Button onClick={() => setCreateGroupOpen(true)}
                className="w-full rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow mb-3">
          <Plus className="mr-2 h-5 w-5" />
          Add Group
        </Button>
      ) : (
        <Button onClick={() => setAddWordOpen(true)}
                className="w-full rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow mb-3">
          <Plus className="mr-2 h-5 w-5" />
          {t('addWord')}
        </Button>
      )}

      {/* Groups toggle button replaces the previous Bulk Import slot */}
      <Button
        variant="outline"
        onClick={handleToggle}
        className="w-full rounded-2xl py-6 text-sm font-medium mb-3"
      >
        <FolderOpen className="mr-2 h-4 w-4" />
        {toggleLabel}
      </Button>

      {/* Difficult / practice row (only on word screens) */}
      {screen.kind !== 'groups' && (
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
      )}

      {showDifficult && (
        <div className="mb-4 bg-destructive/10 border border-destructive/20 rounded-2xl p-3 text-sm text-destructive">
          {t('showingDifficult')} ({difficultWords.length})
        </div>
      )}

      {/* MAIN CONTENT */}
      {screen.kind === 'groups' ? (
        filteredGroups.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
              <FolderOpen className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">No groups yet</h3>
            <p className="text-muted-foreground">Create your first group to organize your vocabulary.</p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {filteredGroups.map(g => (
                <GroupCard
                  key={g.id}
                  id={g.id}
                  name={g.name}
                  count={g.word_count || 0}
                  onOpen={() => setScreen({ kind: 'group', groupId: g.id, groupName: g.name })}
                  onDelete={() => setPendingDeleteGroup({ id: g.id, name: g.name })}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : displayWords.length === 0 ? (
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
        <div className="grid gap-4 sm:grid-cols-2 contain-paint">
          <AnimatePresence mode="popLayout">
            {displayWords.map((word, index) => (
              <VocabularyCard
                key={word.id}
                word={word}
                index={index}
                onDelete={deleteWord}
                onEdit={editWord}
                groups={groups}
                onMoveToGroup={moveWordToGroup}
                onToggleDifficult={setWordDifficult}
                inGroupView={screen.kind === 'group'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddWordDialog
        isOpen={isAddWordOpen}
        onClose={() => setAddWordOpen(false)}
        onAdd={(w, m, n) => addWord(w, m, n, screen.kind === 'group' ? screen.groupId : null)}
      />

      <CreateGroupDialog
        isOpen={isCreateGroupOpen}
        onClose={() => setCreateGroupOpen(false)}
        onCreate={createGroup}
      />

      <AlertDialog open={!!pendingDeleteGroup} onOpenChange={(o) => !o && setPendingDeleteGroup(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{pendingDeleteGroup?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              The group will be removed. The words inside will not be deleted — they will return to your general vocabulary.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-2xl bg-destructive hover:bg-destructive/90"
              onClick={() => {
                if (pendingDeleteGroup) deleteGroup(pendingDeleteGroup.id);
                setPendingDeleteGroup(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
