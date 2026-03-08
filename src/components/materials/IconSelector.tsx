import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Calculator, FlaskConical, Globe, Music, Code, Palette, X,
  Atom, Languages, HeartPulse, Scale, Landmark, Microscope, PenTool, Cpu, Dumbbell, Telescope
} from 'lucide-react';
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
  { key: 'atom', Icon: Atom, label: 'Physics' },
  { key: 'languages', Icon: Languages, label: 'Languages' },
  { key: 'heart-pulse', Icon: HeartPulse, label: 'Health' },
  { key: 'scale', Icon: Scale, label: 'Law' },
  { key: 'landmark', Icon: Landmark, label: 'History' },
  { key: 'microscope', Icon: Microscope, label: 'Biology' },
  { key: 'pen-tool', Icon: PenTool, label: 'Design' },
  { key: 'cpu', Icon: Cpu, label: 'Engineering' },
  { key: 'dumbbell', Icon: Dumbbell, label: 'Sports' },
  { key: 'telescope', Icon: Telescope, label: 'Astronomy' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.03 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 10 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 20 } }
};

export function IconSelector({ isOpen, onClose, currentIcon, onSelect, color }: IconSelectorProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className="relative z-10 w-full max-w-sm mx-4"
          >
            <div className="rounded-3xl bg-card border border-border/50 p-5 shadow-soft">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-card-foreground">
                  Choose Icon
                </h3>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              <motion.div
                className="grid grid-cols-4 gap-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {icons.map(({ key, Icon, label }) => (
                  <motion.button
                    key={key}
                    variants={itemVariants}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => {
                      onSelect(key);
                      onClose();
                    }}
                    className={`
                      flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-colors
                      ${currentIcon === key 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'hover:bg-secondary'
                      }
                    `}
                  >
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </motion.button>
                ))}
              </motion.div>
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
