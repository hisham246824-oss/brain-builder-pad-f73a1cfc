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
import { AppLayout } from "./components/layout/AppLayout";
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

  // Allow admin through if impersonating
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
        {/* Auth pages - full screen, no layout */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        {/* User routes */}
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
