import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, Users, Lightbulb, Menu, X, Shield, LogOut,
  MessageSquare, BarChart, RefreshCw, Home, Headphones
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useNavigate } from 'react-router-dom';

export type AdminTab = 'statistics' | 'accounts' | 'suggestions' | 'messages' | 'polls' | 'support';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onRefresh?: () => void;
}

export function AdminLayout({ children, activeTab, onTabChange, onRefresh }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { isSuperAdmin } = useUserRole();
  const navigate = useNavigate();

  const tabs = [
    { id: 'statistics' as const, label: 'Statistics', icon: BarChart3 },
    { id: 'accounts' as const, label: 'Accounts', icon: Users },
    { id: 'messages' as const, label: 'Messages', icon: MessageSquare },
    { id: 'polls' as const, label: 'Polls', icon: BarChart },
    { id: 'suggestions' as const, label: 'Suggestions', icon: Lightbulb },
    { id: 'support' as const, label: 'Support', icon: Headphones },
  ];

  const TabButton = ({ tab, mobile }: { tab: typeof tabs[0]; mobile?: boolean }) => (
    <button
      key={tab.id}
      onClick={() => {
        onTabChange(tab.id);
        if (mobile) setSidebarOpen(false);
      }}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all',
        activeTab === tab.id
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      <tab.icon className="h-5 w-5" />
      <span className="font-medium">{tab.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-lg lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <button onClick={() => setSidebarOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground">
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
          <div className="flex gap-1">
            {onRefresh && (
              <button onClick={onRefresh} className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground">
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-64 border-r border-border bg-card lg:block">
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-border px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-primary">
              <Shield className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">{isSuperAdmin ? 'Super Admin' : 'Admin'}</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
            {tabs.map(tab => <TabButton key={tab.id} tab={tab} />)}
          </nav>

          <div className="border-t border-border p-4 space-y-2">
            {onRefresh && (
              <button onClick={onRefresh} className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </button>
            )}
            <button onClick={() => navigate('/')} className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-all">
              <Home className="h-4 w-4" />
              Back to Site
            </button>
            <div className="rounded-xl bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="truncate text-sm font-medium text-foreground">{user?.email}</p>
            </div>
            <button onClick={async () => { await signOut(); navigate('/auth', { replace: true }); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-destructive transition-all hover:bg-destructive hover:text-destructive-foreground">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed left-0 top-0 z-50 h-screen w-72 bg-card shadow-xl lg:hidden">
              <div className="flex h-full flex-col">
                <div className="flex h-14 items-center justify-between border-b border-border px-4">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Admin Panel</span>
                  </div>
                  <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <nav className="flex-1 space-y-1 p-4">
                  {tabs.map(tab => <TabButton key={tab.id} tab={tab} mobile />)}
                </nav>
                <div className="border-t border-border p-4 space-y-2">
                  <button onClick={() => { navigate('/'); setSidebarOpen(false); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary/50 px-4 py-2.5 text-sm text-muted-foreground">
                    <Home className="h-4 w-4" /> Back to Site
                  </button>
                  <button onClick={() => signOut()} className="flex w-full items-center justify-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-destructive">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="lg:ml-64">
        <div className="mx-auto max-w-6xl p-4 md:p-6 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
