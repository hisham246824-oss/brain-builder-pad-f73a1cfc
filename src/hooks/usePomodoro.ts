import { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

const modeDurations: Record<TimerMode, number> = {
  study: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function usePomodoro() {
  const [mode, setMode] = useState<TimerMode>('study');
  const [remainingSeconds, setRemainingSeconds] = useState(modeDurations.study);
  const [isRunning, setIsRunning] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const totalSeconds = modeDurations[mode];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  // Create audio element for alarm
  useEffect(() => {
    // Using a simple beep sound from a data URL
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioRef.current = new Audio();
    
    return () => {
      if (audioContext.state !== 'closed') {
        audioContext.close();
      }
    };
  }, []);

  const playAlarm = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a sequence of beeps
    const playBeep = (time: number, frequency: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      oscillator.start(time);
      oscillator.stop(time + 0.5);
    };

    const now = audioContext.currentTime;
    playBeep(now, 880);
    playBeep(now + 0.6, 880);
    playBeep(now + 1.2, 1046.5);
    
    setTimeout(() => audioContext.close(), 2000);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      playAlarm();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds, playAlarm]);

  const changeMode = useCallback((newMode: TimerMode) => {
    setMode(newMode);
    setRemainingSeconds(modeDurations[newMode]);
    setIsRunning(false);
  }, []);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setRemainingSeconds(modeDurations[mode]);
    setIsRunning(false);
  }, [mode]);

  return {
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
  };
}
