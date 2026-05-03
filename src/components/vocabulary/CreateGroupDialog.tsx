import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FolderPlus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CreateGroupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void> | void;
  /** When provided, dialog acts as rename. */
  initialName?: string;
  mode?: 'create' | 'rename';
}

export function CreateGroupDialog({ isOpen, onClose, onCreate, initialName = '', mode = 'create' }: CreateGroupDialogProps) {
  const [name, setName] = useState(initialName);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setName(initialName);
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    await onCreate(name.trim());
    setName('');
    setSubmitting(false);
    onClose();
  };

  const isRename = mode === 'rename';
  const Icon = isRename ? Pencil : FolderPlus;
  const title = isRename ? 'Rename Group' : 'New Group';
  const cta = isRename ? (submitting ? 'Saving…' : 'Save') : (submitting ? 'Creating…' : 'Create');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.14 }}
            className="relative z-10 w-full max-w-md mx-4"
          >
            <div className="rounded-[2rem] bg-card p-6 border border-border">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl flex items-center justify-center bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-semibold">{title}</h2>
                </div>
                <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1 block">Group name</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Travel, Business, Idioms…"
                    className="rounded-2xl py-6"
                    autoFocus
                  />
                </div>
                <Button type="submit" disabled={!name.trim() || submitting || name.trim() === initialName}
                        className="w-full rounded-2xl py-6 text-lg font-medium">
                  {cta}
                </Button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
