import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { StudyDataProvider } from "./contexts/StudyDataContext";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import MaterialsPage from "./pages/MaterialsPage";
import MaterialDetailPage from "./pages/MaterialDetailPage";
import TableCreatorPage from "./pages/TableCreatorPage";
import PomodoroPage from "./pages/PomodoroPage";
import VocabularyPage from "./pages/VocabularyPage";
import ProfileSettingsPage from "./pages/ProfileSettingsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <StudyDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/materials/:id" element={<MaterialDetailPage />} />
                  <Route path="/table-creator" element={<TableCreatorPage />} />
                  <Route path="/pomodoro" element={<PomodoroPage />} />
                  <Route path="/vocabulary" element={<VocabularyPage />} />
                  <Route path="/profile/settings" element={<ProfileSettingsPage />} />
                </Route>
                <Route path="/auth" element={<AuthPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </StudyDataProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
