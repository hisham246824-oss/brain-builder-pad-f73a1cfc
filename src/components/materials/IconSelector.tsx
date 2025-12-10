import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calculator, FlaskConical, Globe, Music, Code, Palette, X } from 'lucide-react';
import { MaterialIcon } from '@/types/study';

interface IconSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  currentIcon: MaterialIcon;
  onSelect: (icon: MaterialIcon) => void;
  color: string;
}

const icons: { key: MaterialIcon; Icon: typeof BookOpen; label: string }[] = [
  { key: 'book', Icon: BookOpen, label: 'Book' },
  { key: 'calculator', Icon: Calculator, label: 'Math' },
  { key: 'flask', Icon: FlaskConical, label: 'Science' },
  { key: 'globe', Icon: Globe, label: 'Geography' },
  { key: 'music', Icon: Music, label: 'Music' },
  { key: 'code', Icon: Code, label: 'Programming' },
  { key: 'palette', Icon: Palette, label: 'Art' },
];

export function IconSelector({ isOpen, onClose, currentIcon, onSelect, color }: IconSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="rounded-2xl bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Choose Icon
                </h3>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-3">
                {icons.map(({ key, Icon, label }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onSelect(key);
                      onClose();
                    }}
                    className={`
                      flex flex-col items-center gap-1 p-3 rounded-xl transition-all
                      ${currentIcon === key 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'hover:bg-secondary'
                      }
                    `}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export function getMaterialIcon(icon: MaterialIcon) {
  const found = icons.find(i => i.key === icon);
  return found?.Icon || BookOpen;
}
