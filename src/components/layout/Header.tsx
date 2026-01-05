import { Menu, GraduationCap, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { useOnlineUsers } from '@/hooks/useOnlineUsers';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const onlineUsers = useOnlineUsers();

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-lg"
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-foreground transition-all hover:bg-primary hover:text-primary-foreground active:scale-95"
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg gradient-primary shadow-glow">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden text-lg font-semibold text-foreground sm:block">
              StudyHub
            </span>
          </div>
        </div>

        {/* Online Users Indicator */}
        {onlineUsers > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <Users className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              {onlineUsers} online
            </span>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
