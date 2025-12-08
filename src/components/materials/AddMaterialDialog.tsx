import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface AddMaterialDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, description?: string) => void;
}

export function AddMaterialDialog({ isOpen, onClose, onAdd }: AddMaterialDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onAdd(title.trim(), description.trim() || undefined);
      setTitle('');
      setDescription('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 px-4"
          >
            <div className="rounded-3xl bg-card p-6 shadow-soft">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-card-foreground">
                  Add New Material
                </h2>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">
                    Title
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Mathematics, History..."
                    className="rounded-xl"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-card-foreground">
                    Description (optional)
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a brief description..."
                    className="min-h-[80px] rounded-xl resize-none"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={!title.trim()}
                  className="w-full rounded-xl"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Material
                </Button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
