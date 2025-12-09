import { motion } from 'framer-motion';
import { TimerCircle } from '@/components/pomodoro/TimerCircle';
import { ModeSelector } from '@/components/pomodoro/ModeSelector';
import { TimerControls } from '@/components/pomodoro/TimerControls';
import { usePomodoro } from '@/hooks/usePomodoro';

export default function PomodoroPage() {
  const {
    mode,
    minutes,
    seconds,
    totalSeconds,
    remainingSeconds,
    isRunning,
    changeMode,
    start,
    pause,
    reset,
  } = usePomodoro();

  return (
    <div className="min-h-screen py-8 px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-md"
      >
        <h1 className="mb-8 text-center text-3xl font-bold text-foreground">
          مؤقت بومودورو
        </h1>

        <div className="flex flex-col items-center gap-10">
          {/* Timer Circle */}
          <TimerCircle
            minutes={minutes}
            seconds={seconds}
            totalSeconds={totalSeconds}
            remainingSeconds={remainingSeconds}
            mode={mode}
          />

          {/* Mode Selector */}
          <ModeSelector
            currentMode={mode}
            onModeChange={changeMode}
            isRunning={isRunning}
          />

          {/* Controls */}
          <TimerControls
            isRunning={isRunning}
            onStart={start}
            onPause={pause}
            onReset={reset}
          />
        </div>

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-12 rounded-2xl bg-card p-6 text-center shadow-soft"
        >
          <h3 className="mb-2 text-lg font-semibold text-card-foreground">
            نصائح للتركيز
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            ابدأ بـ 25 دقيقة من التركيز، ثم خذ استراحة قصيرة 5 دقائق.
            بعد 4 جلسات، خذ استراحة طويلة 15 دقيقة.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
