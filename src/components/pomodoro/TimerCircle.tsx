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
  shortBreak: 'hsl(199 89% 60%)',
  longBreak: 'hsl(142 71% 45%)',
};

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, mode }: TimerCircleProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const circumference = 2 * Math.PI * 140;
  const strokeDashoffset = circumference * (1 - progress);
  const color = modeColors[mode];

  return (
    <div className="relative flex items-center justify-center">
      <svg 
        width="320" 
        height="320" 
        className="transform -rotate-90"
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
      </svg>
      
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
