import { useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { motion, AnimatePresence } from 'framer-motion';

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();
  const [hidden, setHidden] = useState(false);

  return (
    <AnimatePresence>
      {!isOnline && !hidden && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 z-50 bg-destructive text-destructive-foreground py-2 px-4 text-center text-sm font-medium flex items-center justify-center gap-2"
        >
          <WifiOff className="h-4 w-4" />
          <span>You are offline — data is saved locally</span>
          <button onClick={() => setHidden(true)} className="ml-2 p-1 rounded-full hover:bg-destructive-foreground/20 transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
