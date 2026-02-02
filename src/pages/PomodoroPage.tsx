import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { TimerCircle } from '@/components/pomodoro/TimerCircle';
import { ModeSelector } from '@/components/pomodoro/ModeSelector';
import { TimerControls } from '@/components/pomodoro/TimerControls';
import { NatureSounds } from '@/components/pomodoro/NatureSounds';
import { PomodoroSettings, getColorValue } from '@/components/pomodoro/PomodoroSettings';
import { MotivationalPhrases } from '@/components/pomodoro/MotivationalPhrases';
import { AnimatedBackground } from '@/components/pomodoro/AnimatedBackground';
import { usePomodoro } from '@/hooks/usePomodoro';
import { usePomodoroSettings } from '@/hooks/usePomodoroSettings';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function PomodoroPage() {
  const { settings, updateSettings } = usePomodoroSettings();
  const isMobile = useIsMobile();
  const [isPanelVisible, setIsPanelVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

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
  } = usePomodoro(settings.alarmSound);

  // Get current color based on mode
  const getCurrentColor = () => {
    switch (mode) {
      case 'study':
        return getColorValue(settings.studyColor);
      case 'shortBreak':
        return getColorValue(settings.shortBreakColor);
      case 'longBreak':
        return getColorValue(settings.longBreakColor);
      default:
        return getColorValue(settings.studyColor);
    }
  };

  const currentColor = getCurrentColor();

  // Mobile Layout
  if (isMobile) {
    return (
      <div className="min-h-screen py-6 px-4 relative">
        <AnimatedBackground color={currentColor} />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-md flex flex-col items-center"
        >
          {/* Timer Section */}
          <div className="flex flex-col items-center gap-6 mb-6">
            <TimerCircle
              minutes={minutes}
              seconds={seconds}
              totalSeconds={totalSeconds}
              remainingSeconds={remainingSeconds}
              color={currentColor}
            />

            <ModeSelector
              currentMode={mode}
              onModeChange={changeMode}
              isRunning={isRunning}
            />

            <TimerControls
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
            />
          </div>

          {/* Nature Sounds */}
          <div className="w-full bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-4">
            <NatureSounds accentColor={currentColor} />
          </div>

          {/* Settings Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="mb-4"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>

          {/* Settings Panel */}
          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full bg-card/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg mb-4 overflow-hidden"
              >
                <PomodoroSettings
                  settings={settings}
                  onUpdateSettings={updateSettings}
                  currentMode={mode}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Motivational Phrases */}
          <div className="w-full">
            <MotivationalPhrases />
          </div>
        </motion.div>
      </div>
    );
  }

  // Desktop Layout
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground color={currentColor} />
      
      <div className="flex h-screen">
        {/* Left Panel - Sounds & Settings */}
        <AnimatePresence>
          {isPanelVisible && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '50%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              className="h-full bg-card/60 backdrop-blur-md border-r border-border/50 overflow-hidden"
            >
              <div className="h-full flex flex-col p-6 overflow-hidden">
                <h2 className="text-2xl font-bold text-foreground mb-6">Focus Zone</h2>
                
                {/* Nature Sounds */}
                <div className="flex-1 min-h-0 mb-6">
                  <NatureSounds accentColor={currentColor} />
                </div>

                {/* Settings */}
                <div className="border-t border-border/50 pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Settings</h3>
                  <PomodoroSettings
                    settings={settings}
                    onUpdateSettings={updateSettings}
                    currentMode={mode}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toggle Button */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10">
          <motion.div
            animate={{ left: isPanelVisible ? 'calc(50% - 16px)' : '0px' }}
            transition={{ duration: 0.3 }}
            className="relative"
            style={{ left: isPanelVisible ? 'calc(50% - 16px)' : '0px' }}
          >
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsPanelVisible(!isPanelVisible)}
              className="h-12 w-8 rounded-l-none rounded-r-lg shadow-lg"
              style={{ 
                position: 'fixed',
                left: isPanelVisible ? 'calc(50% - 1px)' : '0px',
                transition: 'left 0.3s ease-in-out'
              }}
            >
              {isPanelVisible ? (
                <ChevronLeft className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </motion.div>
        </div>

        {/* Right Panel - Timer */}
        <motion.div
          animate={{ 
            width: isPanelVisible ? '50%' : '100%',
            paddingLeft: isPanelVisible ? '0' : '0'
          }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="flex flex-col items-center justify-center p-8"
        >
          <motion.div
            layout
            className="flex flex-col items-center gap-8"
          >
            <TimerCircle
              minutes={minutes}
              seconds={seconds}
              totalSeconds={totalSeconds}
              remainingSeconds={remainingSeconds}
              color={currentColor}
            />

            <ModeSelector
              currentMode={mode}
              onModeChange={changeMode}
              isRunning={isRunning}
            />

            <TimerControls
              isRunning={isRunning}
              onStart={start}
              onPause={pause}
              onReset={reset}
            />

            {/* Motivational Phrases */}
            <div className="mt-8 max-w-md">
              <MotivationalPhrases />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
