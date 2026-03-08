import { Menu, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { SyncStatusIndicator } from '@/components/SyncStatusIndicator';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-md composite-layer"
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

        {/* Sync status indicator */}
        <SyncStatusIndicator />
      </div>
    </motion.header>
  );
}
