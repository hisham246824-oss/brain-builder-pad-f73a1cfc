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
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 w-full contain-paint">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ 
              duration: 0.166, 
              ease: [0.22, 1, 0.36, 1],
              opacity: { duration: 0.133 }
            }}
            className="h-full composite-layer"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <CopyrightFooter />
    </div>
  );
}
