import { motion, AnimatePresence } from 'framer-motion';
import { X, Home, BookOpen, BookA, Timer, Mail, Lightbulb, ListTodo, Headphones, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const SECTIONS = [
  { id: 'home', icon: Home, titleKey: 'home', descKey: 'infoHome' },
  { id: 'materials', icon: BookOpen, titleKey: 'studyMaterials', descKey: 'infoMaterials' },
  { id: 'vocabulary', icon: BookA, titleKey: 'vocabulary', descKey: 'infoVocabulary' },
  { id: 'pomodoro', icon: Timer, titleKey: 'pomodoroTimer', descKey: 'infoPomodoro' },
  { id: 'messages', icon: Mail, titleKey: 'messages', descKey: 'infoMessages' },
  { id: 'suggestions', icon: Lightbulb, titleKey: 'suggestions', descKey: 'infoSuggestions' },
  { id: 'todos', icon: ListTodo, titleKey: 'todoList', descKey: 'infoTodos' },
  { id: 'support', icon: Headphones, titleKey: 'technicalSupport', descKey: 'infoSupport' },
];

const GRADIENT_PAIRS = [
  'from-blue-500/15 to-cyan-500/10',
  'from-violet-500/15 to-purple-500/10',
  'from-emerald-500/15 to-teal-500/10',
  'from-rose-500/15 to-pink-500/10',
  'from-amber-500/15 to-orange-500/10',
  'from-indigo-500/15 to-blue-500/10',
  'from-green-500/15 to-emerald-500/10',
  'from-fuchsia-500/15 to-violet-500/10',
];

interface SidebarInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SidebarInfoModal({ isOpen, onClose }: SidebarInfoModalProps) {
  const { t, isRTL } = useLanguage();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-foreground/40 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-lg max-h-[85vh] flex flex-col"
          >
            <div className="rounded-[2rem] bg-card border border-border/50 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 shrink-0">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm">
                      <Sparkles className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-primary-foreground">{t('siteGuideTitle')}</h2>
                      <p className="text-sm text-primary-foreground/70">{t('siteGuideSubtitle')}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-primary-foreground/80 hover:bg-white/25 hover:text-primary-foreground transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Sections */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {SECTIONS.map((section, i) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className={`rounded-[1.5rem] bg-gradient-to-br ${GRADIENT_PAIRS[i]} border border-border/30 p-4`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 shadow-sm shrink-0 mt-0.5">
                        <section.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{t(section.titleKey)}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{t(section.descKey)}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
