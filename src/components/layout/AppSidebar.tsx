import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Home, X, GraduationCap, Table2, Timer, BookA, User, LogOut } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/auth/AuthDialog';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/materials', icon: BookOpen, label: 'Study Materials' },
  { to: '/vocabulary', icon: BookA, label: 'Vocabulary' },
  { to: '/table-creator', icon: Table2, label: 'Create Table' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro Timer' },
];

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, signOut, isLoading } = useAuth();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onClose();
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 h-full w-72 bg-sidebar shadow-soft"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-sidebar-border p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
                      <GraduationCap className="h-5 w-5 text-sidebar-primary-foreground" />
                    </div>
                    <span className="text-lg font-semibold text-sidebar-foreground">StudyHub</span>
                  </div>
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <nav className="flex-1 p-4">
                  <ul className="space-y-1">
                    {navItems.map((item) => (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </nav>

                <div className="border-t border-sidebar-border p-4">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {user.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm text-sidebar-foreground truncate flex-1">
                          {user.email}
                        </span>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-destructive/10 hover:text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAuthDialog(true)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <User className="h-5 w-5" />
                      <span>Sign In / Create Account</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AuthDialog isOpen={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
    </>
  );
}
