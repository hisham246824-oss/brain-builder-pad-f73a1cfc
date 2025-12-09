import { useState, useEffect, useCallback } from 'react';

type TimerMode = 'study' | 'shortBreak' | 'longBreak';
export type AlarmSound = 'beep' | 'chime' | 'bell' | 'gentle';

const modeDurations: Record<TimerMode, number> = {
  study: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

const playSound = (sound: AlarmSound) => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  const playTone = (time: number, frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, time);
    gainNode.gain.exponentialRampToValueAtTime(0.01, time + duration);
    
    oscillator.start(time);
    oscillator.stop(time + duration);
  };

  const now = audioContext.currentTime;

  switch (sound) {
    case 'beep':
      // Classic beep pattern
      playTone(now, 880, 0.5);
      playTone(now + 0.6, 880, 0.5);
      playTone(now + 1.2, 1046.5, 0.5);
      break;
      
    case 'chime':
      // Musical chime
      playTone(now, 523.25, 0.8, 'sine', 0.25);
      playTone(now + 0.3, 659.25, 0.8, 'sine', 0.25);
      playTone(now + 0.6, 783.99, 0.8, 'sine', 0.25);
      playTone(now + 0.9, 1046.5, 1.2, 'sine', 0.3);
      break;
      
    case 'bell':
      // Bell-like sound with harmonics
      playTone(now, 440, 1.5, 'sine', 0.3);
      playTone(now, 880, 1.2, 'sine', 0.15);
      playTone(now, 1320, 0.8, 'sine', 0.1);
      playTone(now + 1.5, 440, 1.5, 'sine', 0.3);
      playTone(now + 1.5, 880, 1.2, 'sine', 0.15);
      break;
      
    case 'gentle':
      // Soft, gentle ascending tones
      playTone(now, 392, 1, 'sine', 0.15);
      playTone(now + 0.8, 440, 1, 'sine', 0.15);
      playTone(now + 1.6, 493.88, 1, 'sine', 0.15);
      playTone(now + 2.4, 523.25, 1.5, 'sine', 0.2);
      break;
  }
  
  setTimeout(() => audioContext.close(), 4000);
};

export function usePomodoro() {
  const [mode, setMode] = useState<TimerMode>('study');
  const [remainingSeconds, setRemainingSeconds] = useState(modeDurations.study);
  const [isRunning, setIsRunning] = useState(false);
  const [alarmSound, setAlarmSound] = useState<AlarmSound>('beep');

  const totalSeconds = modeDurations[mode];
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  const playAlarm = useCallback(() => {
    playSound(alarmSound);
  }, [alarmSound]);

  const previewSound = useCallback((sound: AlarmSound) => {
    playSound(sound);
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

  const changeAlarmSound = useCallback((sound: AlarmSound) => {
    setAlarmSound(sound);
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
    alarmSound,
    changeMode,
    changeAlarmSound,
    previewSound,
    start,
    pause,
    reset,
  };
}
