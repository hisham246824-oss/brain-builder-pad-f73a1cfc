import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { ENGLISH_ARABIC_WORDS } from '@/data/englishArabicWords';

interface BulkImportButtonProps {
  onComplete: () => void;
  existingWords: string[];
}

export function BulkImportButton({ onComplete, existingWords }: BulkImportButtonProps) {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { user } = useAuth();
  const { t } = useLanguage();

  const handleImport = async () => {
    if (!user || isImporting) return;

    const existingLower = new Set(existingWords.map(w => w.toLowerCase()));
    const allWords = Object.entries(ENGLISH_ARABIC_WORDS);
    const newWords = allWords.filter(([word]) => !existingLower.has(word.toLowerCase()));

    if (newWords.length === 0) {
      toast({ title: t('allWordsAlreadyAdded') || 'All words already added!' });
      return;
    }

    setIsImporting(true);
    setProgress(0);

    const BATCH_SIZE = 50;
    let inserted = 0;

    try {
      for (let i = 0; i < newWords.length; i += BATCH_SIZE) {
        const batch = newWords.slice(i, i + BATCH_SIZE).map(([word, meanings]) => ({
          user_id: user.id,
          word,
          meanings,
        }));

        const { error } = await supabase.from('vocabulary').insert(batch);
        if (error) throw error;

        inserted += batch.length;
        setProgress(Math.round((inserted / newWords.length) * 100));
      }

      toast({
        title: `✅ ${inserted} ${t('words') || 'words'} imported with Arabic meanings!`,
      });
      onComplete();
    } catch (error: any) {
      toast({
        title: 'Import error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
      setProgress(0);
    }
  };

  return (
    <Button
      onClick={handleImport}
      disabled={isImporting}
      variant="outline"
      className="w-full rounded-2xl py-6 text-sm font-medium mb-3"
    >
      {isImporting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {progress}%
        </>
      ) : (
        <>
          <Upload className="mr-2 h-4 w-4" />
          {t('bulkImport') || 'Import 1000 English Words (with Arabic)'}
        </>
      )}
    </Button>
  );
}
