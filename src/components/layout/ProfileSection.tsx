import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

interface ProfileSectionProps {
  onClose: () => void;
}

export function ProfileSection({ onClose }: ProfileSectionProps) {
  const { user, displayName, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };
    
    fetchAvatar();
  }, [user]);

  const handleProfileClick = () => {
    if (!user) {
      onClose();
      navigate('/auth');
    } else {
      setShowLogoutConfirm(true);
    }
  };

  const handleSettings = () => {
    onClose();
    navigate('/profile/settings');
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
      <div className="flex items-center gap-2">
        <button
          onClick={handleProfileClick}
          className="flex items-center gap-3 flex-1 p-3 rounded-xl hover:bg-sidebar-accent transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground font-semibold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : user ? (
              getInitial()
            ) : (
              <User className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 text-left min-w-0">
            {user ? (
              <>
                <p className="font-medium text-sidebar-foreground text-sm truncate">
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
        
        {user && (
          <button
            onClick={handleSettings}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
            title="Profile Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        )}
      </div>

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
