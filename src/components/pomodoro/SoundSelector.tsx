import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';

export type AlarmSound = 'beep' | 'chime' | 'bell' | 'gentle';

interface SoundSelectorProps {
  currentSound: AlarmSound;
  onSoundChange: (sound: AlarmSound) => void;
  onPreview: (sound: AlarmSound) => void;
}

const sounds: { key: AlarmSound; label: string }[] = [
  { key: 'beep', label: 'Beep' },
  { key: 'chime', label: 'Chime' },
  { key: 'bell', label: 'Bell' },
  { key: 'gentle', label: 'Gentle' },
];

export function SoundSelector({ currentSound, onSoundChange, onPreview }: SoundSelectorProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Volume2 className="h-4 w-4" />
        <span>Alarm Sound</span>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        {sounds.map((sound) => (
          <motion.button
            key={sound.key}
            onClick={() => {
              onSoundChange(sound.key);
              onPreview(sound.key);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`
              px-4 py-2 rounded-full text-sm font-medium
              transition-all duration-200
              ${currentSound === sound.key
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'bg-secondary text-foreground hover:bg-secondary/80'
              }
            `}
          >
            {sound.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
