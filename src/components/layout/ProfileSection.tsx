import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

interface ProfileSectionProps {
  onClose: () => void;
}

export function ProfileSection({ onClose }: ProfileSectionProps) {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleProfileClick = () => {
    if (!user) {
      onClose();
      navigate('/auth');
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const handleLogout = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    onClose();
  };

  const getInitial = () => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  return (
    <>
      <button
        onClick={handleProfileClick}
        className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-sidebar-accent transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold">
          {user ? getInitial() : <User className="h-5 w-5" />}
        </div>
        <div className="flex-1 text-left">
          {user ? (
            <>
              <p className="font-medium text-sidebar-foreground text-sm">
                {displayName || 'User'}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user.email}
              </p>
            </>
          ) : (
            <p className="font-medium text-sidebar-foreground text-sm">
              Sign In / Create Account
            </p>
          )}
        </div>
      </button>

      {/* Logout Confirmation Dialog */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative z-10 bg-card rounded-2xl p-6 shadow-soft mx-4 max-w-sm w-full"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <LogOut className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-semibold text-card-foreground">Sign Out?</h3>
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to sign out?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1 rounded-xl"
                  onClick={handleLogout}
                >
                  OK
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
