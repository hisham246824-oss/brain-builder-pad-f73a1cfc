import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface AddLessonFormProps {
  onAdd: (title: string) => void;
}

export function AddLessonForm({ onAdd }: AddLessonFormProps) {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim());
      setTitle('');
    }
  };

  return (
    <motion.div
      layout
      className="rounded-2xl bg-card p-4 shadow-card"
    >
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-3 text-muted-foreground transition-all hover:border-primary hover:text-primary"
        >
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add New Lesson</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter lesson title..."
            className="flex-1 rounded-xl"
            autoFocus
            onBlur={() => {
              if (!title.trim()) {
                setIsExpanded(false);
              }
            }}
          />
          <Button
            type="submit"
            disabled={!title.trim()}
            className="rounded-xl"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      )}
    </motion.div>
  );
}
