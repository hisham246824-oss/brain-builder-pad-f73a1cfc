import { motion } from 'framer-motion';

interface TimerCircleProps {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingSeconds: number;
  mode: 'study' | 'shortBreak' | 'longBreak';
}

const modeColors = {
  study: 'hsl(175 60% 35%)',
  shortBreak: 'hsl(199 89% 60%)', // sky-400
  longBreak: 'hsl(142 71% 45%)',
};

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, mode }: TimerCircleProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);
  const color = modeColors[mode];
  
  // Calculate scale based on progress (shrinks from 1 to 0.7 as time decreases)
  const scale = 0.7 + (progress * 0.3);

  return (
    <div className="relative flex items-center justify-center">
      <motion.svg 
        width="320" 
        height="320" 
        className="transform -rotate-90"
        animate={{ scale }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Background circle */}
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke="hsl(var(--secondary))"
          strokeWidth="12"
        />
        {/* Progress circle */}
        <motion.circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        />
      </motion.svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`${minutes}:${seconds}`}
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-bold tabular-nums"
          style={{ color, direction: 'ltr' }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.span>
        <span className="mt-2 text-sm text-muted-foreground capitalize">
          {mode === 'study' ? 'Focus Time' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </span>
      </div>
    </div>
  );
}
