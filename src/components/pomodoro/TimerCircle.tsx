import { motion } from 'framer-motion';

interface TimerCircleProps {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingSeconds: number;
  color: string;
}

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, color }: TimerCircleProps) {
  const progress = totalSeconds > 0 ? remainingSeconds / totalSeconds : 1;
  const circumference = 2 * Math.PI * 140;
  // Progress goes from 0 to circumference as time decreases (clockwise from top)
  const strokeDashoffset = circumference * progress;

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
        {/* Progress circle - starts from top, goes clockwise */}
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
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`${minutes}:${seconds}`}
          initial={{ scale: 1.05, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-6xl font-bold tabular-nums text-foreground"
          style={{ direction: 'ltr' }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.span>
      </div>
    </div>
  );
}
