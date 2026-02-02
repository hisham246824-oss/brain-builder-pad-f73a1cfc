import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PomodoroSettings {
  studyColor: string;
  shortBreakColor: string;
  longBreakColor: string;
  alarmSound: string;
}

const defaultSettings: PomodoroSettings = {
  studyColor: 'teal',
  shortBreakColor: 'sky',
  longBreakColor: 'green',
  alarmSound: 'chime',
};

const LOCAL_STORAGE_KEY = 'pomodoro_settings';

export function usePomodoroSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PomodoroSettings>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from Supabase
  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const loadSettings = async () => {
      const { data, error } = await supabase
        .from('pomodoro_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data && !error) {
        const loadedSettings: PomodoroSettings = {
          studyColor: data.study_color,
          shortBreakColor: data.short_break_color,
          longBreakColor: data.long_break_color,
          alarmSound: data.alarm_sound,
        };
        setSettings(loadedSettings);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(loadedSettings));
      }
      setIsLoading(false);
    };

    loadSettings();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('pomodoro_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pomodoro_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object' && 'study_color' in payload.new) {
            const newData = payload.new as any;
            const updatedSettings: PomodoroSettings = {
              studyColor: newData.study_color,
              shortBreakColor: newData.short_break_color,
              longBreakColor: newData.long_break_color,
              alarmSound: newData.alarm_sound,
            };
            setSettings(updatedSettings);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSettings));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<PomodoroSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    if (user) {
      const { data: existing } = await supabase
        .from('pomodoro_settings')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (existing) {
        await supabase
          .from('pomodoro_settings')
          .update({
            study_color: updated.studyColor,
            short_break_color: updated.shortBreakColor,
            long_break_color: updated.longBreakColor,
            alarm_sound: updated.alarmSound,
          })
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('pomodoro_settings')
          .insert({
            user_id: user.id,
            study_color: updated.studyColor,
            short_break_color: updated.shortBreakColor,
            long_break_color: updated.longBreakColor,
            alarm_sound: updated.alarmSound,
          });
      }
    }
  }, [settings, user]);

  return { settings, updateSettings, isLoading };
}
