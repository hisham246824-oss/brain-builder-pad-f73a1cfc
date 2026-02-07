import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { CopyrightFooter } from './CopyrightFooter';
import { usePageVisitTracking } from '@/hooks/usePageVisitTracking';
import { useTheme } from '@/hooks/useTheme';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  
  usePageVisitTracking();
  useTheme();

  // AI chat page uses full height, no max-width constraint
  const isAiChat = location.pathname === '/ai-chat';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className={isAiChat ? "flex-1 px-0 py-0" : "flex-1 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 w-full"}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {!isAiChat && <CopyrightFooter />}
    </div>
  );
}
