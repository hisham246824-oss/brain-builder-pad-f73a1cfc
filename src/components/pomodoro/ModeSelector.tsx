import { motion } from 'framer-motion';

interface ModeSelectorProps {
  currentMode: 'study' | 'shortBreak' | 'longBreak';
  onModeChange: (mode: 'study' | 'shortBreak' | 'longBreak') => void;
  isRunning: boolean;
}

const modes = [
  { key: 'study' as const, label: '25', subLabel: 'Study', color: 'bg-primary' },
  { key: 'shortBreak' as const, label: '5', subLabel: 'Short Break', color: 'bg-sky-400' },
  { key: 'longBreak' as const, label: '15', subLabel: 'Long Break', color: 'bg-green-500' },
];

export function ModeSelector({ currentMode, onModeChange, isRunning }: ModeSelectorProps) {
  return (
    <div className="flex items-center justify-center gap-6">
      {modes.map((mode) => (
        <motion.button
          key={mode.key}
          onClick={() => !isRunning && onModeChange(mode.key)}
          disabled={isRunning}
          whileHover={!isRunning ? { scale: 1.1 } : undefined}
          whileTap={!isRunning ? { scale: 0.95 } : undefined}
          className={`
            flex flex-col items-center justify-center
            h-20 w-20 rounded-full
            transition-all duration-300
            ${currentMode === mode.key 
              ? `${mode.color} text-white shadow-lg` 
              : 'bg-secondary text-foreground hover:bg-secondary/80'
            }
            ${isRunning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span className="text-xl font-bold">{mode.label}</span>
          <span className="text-[10px] opacity-80">{mode.subLabel}</span>
        </motion.button>
      ))}
    </div>
  );
}
