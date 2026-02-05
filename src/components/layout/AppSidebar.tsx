import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Home, X, GraduationCap, Table2, Timer, BookA, Bot, Mail, Settings, Star, Heart, Zap, Crown, Flame, Rocket, Diamond } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useAuth } from '@/contexts/AuthContext';
import { AuthDialog } from '@/components/auth/AuthDialog';
import { useAdminMessages } from '@/hooks/useAdminMessages';
import { useUserSettings } from '@/hooks/useUserSettings';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const BASE_NAV_ITEMS = [
  { id: 'home', to: '/', icon: Home, label: 'Home' },
  { id: 'materials', to: '/materials', icon: BookOpen, label: 'Study Materials' },
  { id: 'vocabulary', to: '/vocabulary', icon: BookA, label: 'Vocabulary' },
  { id: 'ai-chat', to: '/ai-chat', icon: Bot, label: 'AI Study Chat' },
  { id: 'table-creator', to: '/table-creator', icon: Table2, label: 'Create Table' },
  { id: 'pomodoro', to: '/pomodoro', icon: Timer, label: 'Pomodoro Timer' },
  { id: 'messages', to: '/messages', icon: Mail, label: 'Messages' },
];

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  heart: Heart,
  zap: Zap,
  crown: Crown,
  flame: Flame,
  rocket: Rocket,
  diamond: Diamond,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  teal: 'bg-teal-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  slate: 'bg-slate-500',
};

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { hasUnread, unreadCount } = useAdminMessages();
  const { settings } = useUserSettings();

  // Get sorted nav items based on user settings
  const getSortedNavItems = () => {
    if (!settings?.sidebar_order || settings.sidebar_order.length === 0) {
      return BASE_NAV_ITEMS;
    }
    
    const orderMap = new Map(settings.sidebar_order.map((id, index) => [id, index]));
    return [...BASE_NAV_ITEMS].sort((a, b) => {
      const aIndex = orderMap.get(a.id) ?? 999;
      const bIndex = orderMap.get(b.id) ?? 999;
      return aIndex - bIndex;
    });
  };

  const navItems = getSortedNavItems();
  
  // Separate messages from other nav items for special handling
  const messagesItem = navItems.find(item => item.id === 'messages');
  const otherNavItems = navItems.filter(item => item.id !== 'messages');

  // Messages at top if unread
  const messagesAtTop = hasUnread;

  const handleProfileClick = () => {
    navigate('/settings');
    onClose();
  };

  // Get avatar display
  const IconComponent = settings?.avatar_icon ? ICON_MAP[settings.avatar_icon] : null;
  const avatarLetter = settings?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const avatarColorClass = COLOR_MAP[settings?.avatar_color || 'primary'] || 'bg-primary';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
              onClick={onClose}
            />
            
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="fixed left-0 top-0 z-50 h-full w-72 bg-sidebar shadow-soft rounded-r-3xl"
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

                <nav className="flex-1 p-4 overflow-y-auto">
                  <ul className="space-y-1">
                    {/* Messages button at top if has unread */}
                    {user && messagesAtTop && messagesItem && (
                      <motion.li
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ 
                          opacity: 1, 
                          scale: [1, 1.02, 1],
                        }}
                        transition={{
                          scale: {
                            repeat: Infinity,
                            duration: 2,
                            ease: 'easeInOut'
                          }
                        }}
                      >
                        <NavLink
                          to={messagesItem.to}
                          onClick={onClose}
                          className={cn(
                            "relative flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
                            "bg-primary/10 text-primary font-medium"
                          )}
                          activeClassName="bg-primary text-primary-foreground"
                        >
                          <motion.div
                            animate={{ rotate: [0, -10, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5, repeatDelay: 2 }}
                          >
                            <Mail className="h-5 w-5" />
                          </motion.div>
                          <span>Messages</span>
                          {unreadCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-xs font-bold text-destructive-foreground">
                              {unreadCount}
                            </span>
                          )}
                        </NavLink>
                      </motion.li>
                    )}

                    {otherNavItems.map((item) => (
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

                    {/* Messages button at bottom if no unread */}
                    {user && !messagesAtTop && messagesItem && (
                      <li>
                        <NavLink
                          to={messagesItem.to}
                          onClick={onClose}
                          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                          activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                        >
                          <Mail className="h-5 w-5" />
                          <span>Messages</span>
                        </NavLink>
                      </li>
                    )}
                  </ul>
                </nav>

                <div className="border-t border-sidebar-border p-4">
                  {user ? (
                    <button
                      onClick={handleProfileClick}
                      className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-full text-white text-sm font-medium shrink-0",
                          avatarColorClass
                        )}
                      >
                        {IconComponent ? <IconComponent className="h-5 w-5" /> : avatarLetter}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium truncate text-sidebar-foreground">
                          {settings?.display_name || 'My Profile'}
                        </p>
                        <p className="text-xs text-sidebar-foreground/60 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Settings className="h-5 w-5 shrink-0 text-sidebar-foreground/50" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowAuthDialog(true)}
                      className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        ?
                      </div>
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
