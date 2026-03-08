interface TimerCircleProps {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingSeconds: number;
  color: string;
}

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, color }: TimerCircleProps) {
  const circumference = 2 * Math.PI * 140;
  const elapsed = totalSeconds - remainingSeconds;
  const elapsedRatio = totalSeconds > 0 ? elapsed / totalSeconds : 0;
  const strokeDashoffset = circumference * elapsedRatio;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="320" height="320" className="transform -rotate-90">
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
        {/* Progress circle - CSS transition instead of framer-motion */}
        <circle
          cx="160"
          cy="160"
          r="140"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            transformOrigin: 'center',
          }}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-6xl font-bold tabular-nums text-foreground"
          style={{ direction: 'ltr' }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
