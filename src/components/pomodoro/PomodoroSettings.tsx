import { motion } from 'framer-motion';
import { Palette, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import type { PomodoroSettings as Settings } from '@/hooks/usePomodoroSettings';

interface PomodoroSettingsProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  currentMode: 'study' | 'shortBreak' | 'longBreak';
}

const COLOR_OPTIONS = [
  { id: 'teal', color: 'hsl(175, 60%, 35%)', name: 'Teal' },
  { id: 'sky', color: 'hsl(199, 89%, 50%)', name: 'Sky' },
  { id: 'green', color: 'hsl(142, 71%, 45%)', name: 'Green' },
  { id: 'purple', color: 'hsl(270, 70%, 55%)', name: 'Purple' },
  { id: 'pink', color: 'hsl(330, 80%, 60%)', name: 'Pink' },
  { id: 'orange', color: 'hsl(25, 95%, 55%)', name: 'Orange' },
  { id: 'yellow', color: 'hsl(45, 93%, 50%)', name: 'Yellow' },
  { id: 'red', color: 'hsl(0, 70%, 55%)', name: 'Red' },
  { id: 'indigo', color: 'hsl(230, 70%, 55%)', name: 'Indigo' },
  { id: 'cyan', color: 'hsl(185, 80%, 45%)', name: 'Cyan' },
];

const ALARM_OPTIONS = [
  { id: 'chime', name: 'Chime', icon: '🔔' },
  { id: 'bell', name: 'Bell', icon: '🛎️' },
  { id: 'digital', name: 'Digital', icon: '📟' },
  { id: 'gentle', name: 'Gentle', icon: '🌸' },
  { id: 'nature', name: 'Nature', icon: '🌿' },
];

export function getColorValue(colorId: string): string {
  return COLOR_OPTIONS.find((c) => c.id === colorId)?.color || COLOR_OPTIONS[0].color;
}

export function PomodoroSettings({ settings, onUpdateSettings, currentMode }: PomodoroSettingsProps) {
  const { t } = useLanguage();

  const modeToSettingKey: Record<string, keyof Settings> = {
    study: 'studyColor',
    shortBreak: 'shortBreakColor',
    longBreak: 'longBreakColor',
  };

  const currentColorKey = modeToSettingKey[currentMode];
  const currentColorId = settings[currentColorKey];

  const modeLabel = currentMode === 'study' ? t('study') : currentMode === 'shortBreak' ? t('shortBreak') : t('longBreak');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">{modeLabel}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((colorOption) => (
            <motion.button
              key={colorOption.id}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateSettings({ [currentColorKey]: colorOption.id })}
              className={cn(
                "w-8 h-8 rounded-full transition-all duration-200",
                "ring-2 ring-offset-2 ring-offset-background",
                currentColorId === colorOption.id ? "ring-foreground" : "ring-transparent hover:ring-muted-foreground/50"
              )}
              style={{ backgroundColor: colorOption.color }}
              title={colorOption.name}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">🔔</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {ALARM_OPTIONS.map((alarm) => (
            <motion.button
              key={alarm.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onUpdateSettings({ alarmSound: alarm.id })}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200 border",
                settings.alarmSound === alarm.id
                  ? "bg-primary/20 border-primary/30 text-foreground"
                  : "bg-secondary/50 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <span>{alarm.icon}</span>
              <span className="text-sm">{alarm.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
