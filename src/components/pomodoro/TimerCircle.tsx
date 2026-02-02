import { motion } from 'framer-motion';

interface TimerCircleProps {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingSeconds: number;
  color: string;
}

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, color }: TimerCircleProps) {
  const circumference = 2 * Math.PI * 140;
  
  // Calculate how much of the circle should be visible
  // When timer hasn't started (remaining === total), show full circle
  // As time passes, the colored part disappears clockwise from the start point
  const elapsed = totalSeconds - remainingSeconds;
  const elapsedRatio = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  
  // strokeDashoffset: 0 = full circle, circumference = empty circle
  // We start with full circle and increase offset as time passes
  const strokeDashoffset = circumference * elapsedRatio;

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
          className="opacity-50"
        />
        {/* Progress circle - colored part that disappears as time passes */}
        <motion.circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset }}
          transition={{ 
            duration: 0.8, 
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{ transformOrigin: 'center' }}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          key={`${minutes}:${seconds}`}
          initial={{ scale: 1.02, opacity: 0.9 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="text-6xl font-bold tabular-nums text-foreground"
          style={{ direction: 'ltr' }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </motion.span>
      </div>
    </div>
  );
}
