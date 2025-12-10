import { useState, useEffect, useCallback } from 'react';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';

const modeDurations: Record<TimerMode, number> = {
  study: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const playChime = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (time: number, frequency: number, duration: number, volume: number = 0.25) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const now = audioContext.currentTime;
  
  // Musical chime
  playTone(now, 523.25, 0.8, 0.25);
  playTone(now + 0.3, 659.25, 0.8, 0.25);
  playTone(now + 0.6, 783.99, 0.8, 0.25);
  playTone(now + 0.9, 1046.5, 1.2, 0.3);
  
  setTimeout(() => audioContext.close(), 4000);
};

export function usePomodoro() {
  const [mode, setMode] = useState<TimerMode>('study');
  const [remainingSeconds, setRemainingSeconds] = useState(modeDurations.study);
  const [isRunning, setIsRunning] = useState(false);

  const totalSeconds = modeDurations[mode];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => prev - 1);
      }, 1000);
    } else if (remainingSeconds === 0 && isRunning) {
      setIsRunning(false);
      playChime();
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, remainingSeconds]);

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
