import { motion, AnimatePresence } from 'framer-motion';
import { Home, X, GraduationCap, Table2, Timer, Languages, Podcast, Upload, BarChart3, Video, MessageCircle } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { ProfileSection } from './ProfileSection';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/podcast', icon: Podcast, label: 'Podcast' },
  { to: '/upload-video', icon: Upload, label: 'Upload Video' },
  { to: '/my-videos', icon: Video, label: 'My Videos' },
  { to: '/global-chat', icon: MessageCircle, label: 'Global Chat' },
  { to: '/vocabulary', icon: Languages, label: 'Vocabulary' },
  { to: '/progress', icon: BarChart3, label: 'Progress' },
  { to: '/pomodoro', icon: Timer, label: 'Pomodoro Timer' },
  { to: '/table-creator', icon: Table2, label: 'Create Table' },
];

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%', opacity: 0.8 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0.8 }}
            transition={{ 
              type: 'spring', 
              damping: 28, 
              stiffness: 350,
              mass: 0.8
            }}
            className="fixed left-0 top-0 z-50 h-full w-72 bg-sidebar shadow-2xl rounded-r-3xl overflow-hidden"
          >
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-sidebar-border p-5">
                <motion.div 
                  className="flex items-center gap-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sidebar-primary to-primary-glow shadow-lg shadow-sidebar-primary/20">
                    <GraduationCap className="h-6 w-6 text-sidebar-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold text-sidebar-foreground tracking-tight">
                    StudyHub
                  </span>
                </motion.div>
                <div className="flex items-center gap-1">
                  <ThemeToggle />
                  <button
                    onClick={onClose}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-sidebar-foreground/70 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground hover:scale-105 active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <ul className="space-y-1.5">
                  {navItems.map((item, index) => (
                    <motion.li 
                      key={item.to}
                      initial={{ x: -30, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
                    >
                      <NavLink
                        to={item.to}
                        onClick={onClose}
                        className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-sidebar-foreground/80 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground hover:translate-x-1"
                        activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm"
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="text-[15px]">{item.label}</span>
                      </NavLink>
                    </motion.li>
                  ))}
                </ul>
              </nav>

              {/* Profile Section */}
              <motion.div 
                className="border-t border-sidebar-border p-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <ProfileSection onClose={onClose} />
              </motion.div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
