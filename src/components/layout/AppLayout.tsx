import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { CopyrightFooter } from './CopyrightFooter';
import { usePageVisitTracking } from '@/hooks/usePageVisitTracking';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useTheme } from '@/hooks/useTheme';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  usePageVisitTracking();
  useRealtimeNotifications();
  useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 w-full">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <CopyrightFooter />
    </div>
  );
}
