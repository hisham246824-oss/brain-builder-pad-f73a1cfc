interface TimerCircleProps {
  minutes: number;
  seconds: number;
  totalSeconds: number;
  remainingSeconds: number;
  color: string;
  isRunning?: boolean;
}

export function TimerCircle({ minutes, seconds, totalSeconds, remainingSeconds, color, isRunning = false }: TimerCircleProps) {
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
        {/* Progress circle */}
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
            transition: 'stroke-dashoffset 0.4s ease-out, stroke 0.2s ease-out',
            transformOrigin: 'center',
          }}
        />
      </svg>
      
      {/* Time display */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-6xl font-bold tabular-nums text-foreground"
          style={{ direction: 'ltr', opacity: isRunning ? 1 : 0.8 }}
        >
          {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </span>
      </div>
    </div>
  );
}
