import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Home, Bot, Table2, Timer, Mail, Lightbulb, ListTodo, BookA } from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  home: Home,
  materials: BookOpen,
  vocabulary: BookA,
  'ai-chat': Bot,
  'table-creator': Table2,
  pomodoro: Timer,
  messages: Mail,
  suggestions: Lightbulb,
  todos: ListTodo,
};

interface SidebarInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  itemId: string;
}

export function SidebarInfoModal({ isOpen, onClose, title, description, itemId }: SidebarInfoModalProps) {
  const Icon = ICON_MAP[itemId] || BookOpen;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 w-full max-w-sm"
          >
            <div className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden">
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-primary to-primary/80 p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-bold text-primary-foreground">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-primary-foreground/80 hover:bg-white/25 hover:text-primary-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Content */}
              <div className="p-5">
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
