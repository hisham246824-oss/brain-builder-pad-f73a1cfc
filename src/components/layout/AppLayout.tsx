import { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { AppSidebar } from './AppSidebar';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { CopyrightFooter } from './CopyrightFooter';
import { usePageVisitTracking } from '@/hooks/usePageVisitTracking';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';
import { useTheme } from '@/hooks/useTheme';

const RouteFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  usePageVisitTracking();
  useRealtimeNotifications();
  useTheme();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <OfflineIndicator />
      <Header onMenuClick={() => setSidebarOpen(true)} />
      <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="flex-1 mx-auto max-w-5xl px-4 py-6 md:px-6 md:py-8 w-full">
        <Suspense fallback={<RouteFallback />}>
          <Outlet />
        </Suspense>
      </main>
      <CopyrightFooter />
    </div>
  );
}
