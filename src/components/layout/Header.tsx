import { Menu, GraduationCap, ArrowRight, ArrowLeft, Eye, Loader2, WifiOff, X } from 'lucide-react';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';
import { useImportantMessage } from '@/hooks/useImportantMessage';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminImpersonation } from '@/contexts/AdminImpersonationContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { showBar, importantMessage, getTitle, dismiss } = useImportantMessage();
  const { isRTL, t } = useLanguage();
  const { isImpersonating, targetDisplayName, targetEmail, stopImpersonation, isLoading: impLoading } = useAdminImpersonation();
  const { isOnline } = useNetworkStatus();
  const navigate = useNavigate();
  const [offlineHidden, setOfflineHidden] = useState(false);

  const handleGoToMessage = () => {
    dismiss();
    navigate('/messages');
  };

  const handleReturnToAdmin = async () => {
    await stopImpersonation();
    navigate('/admin');
  };

  const showOffline = !isOnline && !offlineHidden;

  // Impersonation mode - transparent yellow header
  if (isImpersonating) {
    return (
      <header className="sticky top-0 z-30 border-b border-yellow-400/30 backdrop-blur-md gpu" style={{ backgroundColor: 'hsla(45, 93%, 47%, 0.12)' }}>
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
              <span className="hidden text-lg font-semibold text-foreground sm:block">StudyHub</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-yellow-700 dark:text-yellow-300">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">{t('viewingAs')}: {targetDisplayName || targetEmail}</span>
              <span className="sm:hidden">{(targetDisplayName || targetEmail || '').slice(0, 12)}</span>
            </div>
            <button
              onClick={handleReturnToAdmin}
              disabled={impLoading}
              className="flex items-center gap-2 rounded-[1.25rem] px-4 py-2 text-sm font-bold transition-all active:scale-[0.97] hover:opacity-80 disabled:opacity-50 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border border-yellow-400/30"
            >
              {impLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />}
              {t('returnToAdmin')}
            </button>
          </div>
        </div>
      </header>
    );
  }

  // Offline mode - glassy red header
  if (showOffline) {
    return (
      <header className="sticky top-0 z-30 border-b border-destructive/30 backdrop-blur-md gpu" style={{ backgroundColor: 'hsla(0, 70%, 50%, 0.12)' }}>
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuClick}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors duration-150 hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <WifiOff className="h-5 w-5 text-destructive" />
              <span className="text-sm font-semibold text-destructive">{t('internetOutage')}</span>
            </div>
          </div>
          <button
            onClick={() => setOfflineHidden(true)}
            className="flex items-center gap-2 rounded-[1.25rem] px-4 py-2 text-sm font-medium backdrop-blur-sm bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors active:scale-[0.97]"
          >
            <X className="h-4 w-4" />
            {t('hide')}
          </button>
        </div>
      </header>
    );
  }

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
                {t('goToMessage')}
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
              <span className="hidden text-lg font-semibold text-foreground sm:block">StudyHub</span>
            </div>
          </div>
          {!showBar && <SyncStatusIndicator />}
        </div>
      </header>
    </>
  );
}
