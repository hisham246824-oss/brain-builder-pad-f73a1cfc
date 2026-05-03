import { motion } from 'framer-motion';
import { Trash2, Pencil, ChevronRight } from 'lucide-react';
import { VocabularyLogo } from './VocabularyLogo';

interface GroupCardProps {
  id: string;
  name: string;
  count: number;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
}

export function GroupCard({ name, count, onOpen, onDelete, onRename }: GroupCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.12 }}
      className="group relative rounded-[2rem] border border-border/60 bg-card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      onClick={onOpen}
    >
      <div className="flex items-center gap-4 p-4">
        <div className="relative h-14 w-14 shrink-0 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20">
          <VocabularyLogo size={36} />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-base">{name}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {count} {count === 1 ? 'word' : 'words'}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onRename(); }}
            className="p-2 rounded-xl text-primary/80 hover:text-primary hover:bg-primary/10 transition-colors active:scale-[0.95]"
            aria-label="Rename group"
            title="Rename"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-2 rounded-xl text-destructive/80 hover:text-destructive hover:bg-destructive/10 transition-colors active:scale-[0.95]"
            aria-label="Delete group"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <ChevronRight className="h-5 w-5 text-muted-foreground/60 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </motion.div>
  );
}
