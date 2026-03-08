import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserSettings {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_color: string;
  avatar_icon: string | null;
  ai_custom_prompt: string | null;
  sidebar_order: string[];
  theme: string;
  language: string;
}

const CACHE_KEY = 'studyhub-user-settings';

const DEFAULT_SETTINGS: Omit<UserSettings, 'id' | 'user_id'> = {
  display_name: null,
  avatar_color: 'primary',
  avatar_icon: null,
  ai_custom_prompt: null,
  sidebar_order: ['home', 'materials', 'vocabulary', 'ai-chat', 'table-creator', 'pomodoro', 'suggestions', 'todos', 'messages'],
  theme: 'light',
  language: 'en',
};

const AVATAR_COLORS = [
  { name: 'Primary', value: 'primary', class: 'bg-primary' },
  { name: 'Red', value: 'red', class: 'bg-red-500' },
  { name: 'Orange', value: 'orange', class: 'bg-orange-500' },
  { name: 'Yellow', value: 'yellow', class: 'bg-yellow-500' },
  { name: 'Green', value: 'green', class: 'bg-green-500' },
  { name: 'Teal', value: 'teal', class: 'bg-teal-500' },
  { name: 'Blue', value: 'blue', class: 'bg-blue-500' },
  { name: 'Purple', value: 'purple', class: 'bg-purple-500' },
  { name: 'Pink', value: 'pink', class: 'bg-pink-500' },
  { name: 'Slate', value: 'slate', class: 'bg-slate-500' },
];

const AVATAR_ICONS = [
  { name: 'None', value: null },
  { name: 'Star', value: 'star' },
  { name: 'Heart', value: 'heart' },
  { name: 'Zap', value: 'zap' },
  { name: 'Crown', value: 'crown' },
  { name: 'Flame', value: 'flame' },
  { name: 'Rocket', value: 'rocket' },
  { name: 'Diamond', value: 'diamond' },
];

function getCachedSettings(): UserSettings | null {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
}

function setCachedSettings(settings: UserSettings) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(settings));
  } catch { /* ignore quota errors */ }
}

export function useUserSettings() {
  const { user } = useAuth();
  const cachedRef = useRef(getCachedSettings());
  const [settings, setSettings] = useState<UserSettings | null>(cachedRef.current);
  const [isLoading, setIsLoading] = useState(!cachedRef.current);
  const hasFetched = useRef(false);

  const fetchSettings = useCallback(async () => {
    if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching settings:', error);
    }

    if (data) {
      const s = data as UserSettings;
      setSettings(s);
      setCachedSettings(s);
    } else {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({ user_id: user.id, ...DEFAULT_SETTINGS })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating settings:', insertError);
      } else {
        const s = newSettings as UserSettings;
        setSettings(s);
        setCachedSettings(s);
      }
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    // If we have cached settings for the current user, show them instantly
    const cached = getCachedSettings();
    if (cached && user && cached.user_id === user.id) {
      setSettings(cached);
      setIsLoading(false);
    } else if (!user) {
      setSettings(null);
      setIsLoading(false);
      return;
    }

    // Background refresh from server (stale-while-revalidate)
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchSettings();
    }
  }, [user, fetchSettings]);

  // Reset fetch flag when user changes
  useEffect(() => {
    hasFetched.current = false;
  }, [user?.id]);

  const updateSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user || !settings) return;

    // Optimistic update + cache
    const updated = { ...settings, ...updates };
    setSettings(updated);
    setCachedSettings(updated);

    const { error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error updating settings:', error);
      fetchSettings();
    }
  }, [user, settings, fetchSettings]);

  const getAvatarColorClass = useCallback((colorValue: string) => {
    const color = AVATAR_COLORS.find(c => c.value === colorValue);
    return color?.class || 'bg-primary';
  }, []);

  return {
    settings,
    isLoading,
    updateSettings,
    fetchSettings,
    getAvatarColorClass,
    AVATAR_COLORS,
    AVATAR_ICONS,
  };
}
