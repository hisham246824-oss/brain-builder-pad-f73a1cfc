import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Palette, Bot, Moon, Sun, GripVertical, Check, 
  Star, Heart, Zap, Crown, Flame, Rocket, Diamond,
  Lock, Eye, EyeOff, ArrowLeft, LogOut
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star,
  heart: Heart,
  zap: Zap,
  crown: Crown,
  flame: Flame,
  rocket: Rocket,
  diamond: Diamond,
};

const SIDEBAR_LABELS: Record<string, string> = {
  home: 'Home',
  materials: 'Study Materials',
  vocabulary: 'Vocabulary',
  'ai-chat': 'AI Study Chat',
  'table-creator': 'Create Table',
  pomodoro: 'Pomodoro Timer',
  suggestions: 'Suggestions',
  messages: 'Messages',
};

function SortableItem({ id }: { id: string }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing touch-none"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm font-medium">{SIDEBAR_LABELS[id] || id}</span>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateSettings, isLoading, AVATAR_COLORS, AVATAR_ICONS, getAvatarColorClass } = useUserSettings();
  
  const [displayName, setDisplayName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [sidebarOrder, setSidebarOrder] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.display_name || '');
      setAiPrompt(settings.ai_custom_prompt || '');
      setSidebarOrder(settings.sidebar_order || []);
    }
  }, [settings]);

  useEffect(() => {
    // Apply theme
    if (settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.theme]);

  const handleSaveDisplayName = async () => {
    await updateSettings({ display_name: displayName || null });
    toast.success('Display name updated');
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      toast.error(error.message || 'Failed to change password');
    } else {
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }

    setIsChangingPassword(false);
  };

  const handleAvatarColorChange = async (color: string) => {
    await updateSettings({ avatar_color: color });
  };

  const handleAvatarIconChange = async (icon: string | null) => {
    await updateSettings({ avatar_icon: icon });
  };

  const handleThemeToggle = async () => {
    const newTheme = settings?.theme === 'dark' ? 'light' : 'dark';
    await updateSettings({ theme: newTheme });
  };

  const handleSaveAiPrompt = async () => {
    await updateSettings({ ai_custom_prompt: aiPrompt || null });
    toast.success('AI preferences updated');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sidebarOrder.indexOf(active.id as string);
      const newIndex = sidebarOrder.indexOf(over.id as string);
      const newOrder = arrayMove(sidebarOrder, oldIndex, newIndex);
      setSidebarOrder(newOrder);
    }
  };

  const handleSaveSidebarOrder = async () => {
    await updateSettings({ sidebar_order: sidebarOrder });
    toast.success('Sidebar order saved');
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const IconComponent = settings?.avatar_icon ? ICON_MAP[settings.avatar_icon] : null;
  const avatarLetter = settings?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur-lg">
        <div className="flex h-16 items-center gap-4 px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Settings</h1>
        </div>
      </header>

      <div className="container max-w-2xl py-8 px-4 space-y-8">
        {/* Profile Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>

          <div className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              <div
                className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold",
                  getAvatarColorClass(settings?.avatar_color || 'primary')
                )}
              >
                {IconComponent ? <IconComponent className="h-8 w-8" /> : avatarLetter}
              </div>
              <div>
                <p className="font-medium">{settings?.display_name || user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name..."
                  className="rounded-xl"
                />
                <Button onClick={handleSaveDisplayName} className="rounded-xl">
                  Save
                </Button>
              </div>
            </div>

            {/* Avatar Color */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Avatar Color</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleAvatarColorChange(color.value)}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                      color.class,
                      settings?.avatar_color === color.value && "ring-2 ring-offset-2 ring-primary"
                    )}
                  >
                    {settings?.avatar_color === color.value && (
                      <Check className="h-5 w-5 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Icon */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Avatar Icon</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_ICONS.map((icon) => {
                  const Icon = icon.value ? ICON_MAP[icon.value] : null;
                  return (
                    <button
                      key={icon.value || 'none'}
                      onClick={() => handleAvatarIconChange(icon.value)}
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center bg-secondary transition-transform hover:scale-110",
                        settings?.avatar_icon === icon.value && "ring-2 ring-primary"
                      )}
                    >
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs">None</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Change Password */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">Change Password</label>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Input
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password..."
                    className="rounded-xl pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  type={showPasswords ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="rounded-xl"
                />
                <Button
                  onClick={handleChangePassword}
                  disabled={!newPassword || !confirmPassword || isChangingPassword}
                  className="w-full rounded-xl"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* AI Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-6">
            <Bot className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Preferences</h2>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Customize how the AI responds to you. This prompt will be included in all AI conversations.
            </p>
            <Textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Explain things simply, use examples, be encouraging..."
              className="min-h-[120px] rounded-xl"
            />
            <Button onClick={handleSaveAiPrompt} className="rounded-xl">
              Save AI Preferences
            </Button>
          </div>
        </motion.section>

        {/* Theme Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.theme === 'dark' ? (
                <Moon className="h-5 w-5 text-primary" />
              ) : (
                <Sun className="h-5 w-5 text-primary" />
              )}
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">
                  {settings?.theme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
                </p>
              </div>
            </div>
            <Switch
              checked={settings?.theme === 'dark'}
              onCheckedChange={handleThemeToggle}
            />
          </div>
        </motion.section>

        {/* Sidebar Order Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-6">
            <GripVertical className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Sidebar Order</h2>
          </div>

          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop to reorder the sidebar navigation buttons.
          </p>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sidebarOrder}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sidebarOrder.map((id) => (
                  <SortableItem key={id} id={id} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <Button onClick={handleSaveSidebarOrder} className="w-full mt-4 rounded-xl">
            Save Sidebar Order
          </Button>
        </motion.section>

        {/* Logout Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 shadow-soft"
        >
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">Account</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sign out of your account on this device.
          </p>
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="w-full rounded-xl"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </motion.section>
      </div>
    </div>
  );
}
