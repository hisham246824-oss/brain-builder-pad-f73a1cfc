import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TimerControlsProps {
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export function TimerControls({ isRunning, onStart, onPause, onReset }: TimerControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4">
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          variant="outline"
          size="lg"
          onClick={onReset}
          className="h-14 w-14 rounded-full"
        >
          <RotateCcw className="h-6 w-6" />
        </Button>
      </motion.div>
      
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          size="lg"
          onClick={isRunning ? onPause : onStart}
          className="h-16 w-32 rounded-full text-lg font-semibold"
        >
          {isRunning ? (
            <>
              <Pause className="mr-2 h-6 w-6" />
              Pause
            </>
          ) : (
            <>
              <Play className="mr-2 h-6 w-6" />
              Start
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
}
