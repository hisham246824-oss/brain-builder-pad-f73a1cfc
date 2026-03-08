import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AdminImpersonationProvider, useAdminImpersonation } from "@/contexts/AdminImpersonationContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AdminImpersonationBar } from "@/components/admin/AdminImpersonationBar";
import { BlockedScreen } from "@/components/BlockedScreen";
import { AppLayout } from "./components/layout/AppLayout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import TableCreatorPage from "./pages/TableCreatorPage";
import PomodoroPage from "./pages/PomodoroPage";
import VocabularyPage from "./pages/VocabularyPage";
import FlashcardsPage from "./pages/FlashcardsPage";
import AIChatPage from "./pages/AIChatPage";
import MessagesPage from "./pages/MessagesPage";
import AdminDashboard from "./pages/AdminDashboard";
import SettingsPage from "./pages/SettingsPage";
import SuggestionsPage from "./pages/SuggestionsPage";
import TodoPage from "./pages/TodoPage";
import SupportPage from "./pages/SupportPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

function BlockCheck({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [blockInfo, setBlockInfo] = useState<{ blocked_until: string; reason: string | null } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!user) { setChecked(true); setBlockInfo(null); return; }
    const checkBlock = async () => {
      const { data } = await supabase
        .from('user_blocks')
        .select('blocked_until, reason')
        .eq('user_id', user.id)
        .gt('blocked_until', new Date().toISOString())
        .order('blocked_until', { ascending: false })
        .limit(1)
        .maybeSingle();
      setBlockInfo(data || null);
      setChecked(true);
    };
    checkBlock();

    // Realtime: instant block detection
    const channel = supabase
      .channel('user-block-check')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_blocks', filter: `user_id=eq.${user.id}` },
        () => { checkBlock(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (blockInfo) {
    return (
      <BlockedScreen
        blockedUntil={blockInfo.blocked_until}
        reason={blockInfo.reason}
        isAdmin={isAdmin}
        onReturnToAdmin={() => window.location.href = '/admin'}
      />
    );
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useUserRole();
  const { user, isLoading: authLoading } = useAuth();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function UserRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useUserRole();
  const { isLoading: authLoading } = useAuth();
  const { isImpersonating } = useAdminImpersonation();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdmin && !isImpersonating) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}

function RootRedirect() {
  const { isAdmin, isLoading } = useUserRole();
  const { isLoading: authLoading } = useAuth();
  const { isImpersonating } = useAdminImpersonation();

  if (authLoading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isAdmin && !isImpersonating) {
    return <Navigate to="/admin" replace />;
  }

  return <Index />;
}

function AppRoutes() {
  return (
    <>
      <AdminImpersonationBar />
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
        <Route element={<AppLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/materials" element={<MaterialsPage />} />
          <Route path="/materials/:id" element={<MaterialDetailPage />} />
          <Route path="/table-creator" element={<TableCreatorPage />} />
          <Route path="/pomodoro" element={<PomodoroPage />} />
          <Route path="/vocabulary" element={<VocabularyPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/ai-chat" element={<AIChatPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/suggestions" element={<SuggestionsPage />} />
          <Route path="/todos" element={<TodoPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <AdminImpersonationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <BlockCheck>
                <AppRoutes />
              </BlockCheck>
            </BrowserRouter>
          </TooltipProvider>
        </AdminImpersonationProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
