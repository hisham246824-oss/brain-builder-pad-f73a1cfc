import { Menu, GraduationCap, ArrowRight, ArrowLeft } from 'lucide-react';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useImportantMessage } from '@/hooks/useImportantMessage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { showBar, importantMessage, getTitle, dismiss } = useImportantMessage();
  const { isRTL, t } = useLanguage();
  const navigate = useNavigate();

  const handleGoToMessage = () => {
    dismiss();
    navigate('/messages');
  };

  return (
    <>
      <AnimatePresence>
        {showBar && importantMessage && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="sticky top-0 z-40 bg-sky-500/15 backdrop-blur-xl border-b border-sky-400/20"
          >
            <div className="flex h-11 items-center justify-between px-4 md:px-6 gap-3">
              <button
                onClick={handleGoToMessage}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-700 dark:text-sky-300 text-xs font-semibold transition-all active:scale-[0.97] ${isRTL ? 'order-2' : 'order-1'}`}
              >
                {isRTL ? <ArrowLeft className="h-3.5 w-3.5" /> : null}
                {t('goToMessage') || 'Go to Message'}
                {!isRTL ? <ArrowRight className="h-3.5 w-3.5" /> : null}
              </button>

              <p className="flex-1 text-center text-sm font-medium text-sky-800 dark:text-sky-200 truncate order-2">
                {getTitle()}
              </p>

              <div className={`${isRTL ? 'order-1' : 'order-3'}`}>
                <SyncStatusIndicator />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md gpu" style={showBar ? { position: 'relative', zIndex: 29 } : {}}>
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors duration-150 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary">
                <GraduationCap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="hidden text-lg font-semibold text-foreground sm:block">
                StudyHub
              </span>
            </div>
          </div>

          {!showBar && <SyncStatusIndicator />}
        </div>
      </header>
    </>
  );
}
