import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
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
        <Outlet />
      </main>
      {!isAiChat && <CopyrightFooter />}
    </div>
  );
}
