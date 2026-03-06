import { motion } from 'framer-motion';
import { Table2 } from 'lucide-react';
import { TableEditor } from '@/components/table/TableEditor';
import { useLanguage } from '@/contexts/LanguageContext';

export default function TableCreatorPage() {
  const { t } = useLanguage();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container max-w-6xl mx-auto py-8 px-4"
    >
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl gradient-primary shadow-glow">
            <Table2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t('tableCreatorTitle')}</h1>
        </div>
        <p className="text-muted-foreground">
          {t('tableCreatorDesc')}
        </p>
      </div>

      <TableEditor />
    </motion.div>
  );
}
