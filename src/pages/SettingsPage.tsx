import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Palette, Moon, Sun, GripVertical, Check, 
  Star, Heart, Zap, Crown, Flame, Rocket, Diamond,
  Lock, Eye, EyeOff, ArrowLeft, LogOut, Globe, Copy, Hash, Headphones, ChevronRight, Camera
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, heart: Heart, zap: Zap, crown: Crown, flame: Flame, rocket: Rocket, diamond: Diamond,
};

function SortableItem({ id, label }: { id: string; label: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} className={cn("flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50", isDragging && "opacity-50 shadow-lg")}>
      <button className="cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </button>
      <span className="flex-1 text-sm font-medium">{label}</span>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { settings, updateSettings, isLoading, AVATAR_COLORS, AVATAR_ICONS, getAvatarColorClass } = useUserSettings();
  const { t, language, setLanguage, LANGUAGE_INFO, isRTL } = useLanguage();
  
  const [displayName, setDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [sidebarOrder, setSidebarOrder] = useState<string[]>([]);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const VALID_SIDEBAR_IDS = ['home', 'materials', 'pomodoro', 'suggestions', 'todos', 'vocabulary'];

  const SIDEBAR_LABELS: Record<string, string> = {
    home: t('home'), materials: t('studyMaterials'), vocabulary: t('vocabulary'),
    pomodoro: t('pomodoroTimer'),
    suggestions: t('suggestions'), todos: t('todoList'),
  };

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.display_name || '');
      const filteredOrder = (settings.sidebar_order || []).filter(id => VALID_SIDEBAR_IDS.includes(id));
      setSidebarOrder(filteredOrder.length > 0 ? filteredOrder : VALID_SIDEBAR_IDS);
    }
  }, [settings]);

  useEffect(() => {
    if (settings?.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.theme]);

  const handleSaveDisplayName = async () => {
    await updateSettings({ display_name: displayName || null });
    toast.success(t('displayNameUpdated'));
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) { toast.error(t('passwordsDontMatch')); return; }
    if (newPassword.length < 6) { toast.error(t('passwordTooShort')); return; }
    setIsChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); } else {
      toast.success(t('passwordChanged'));
      setNewPassword(''); setConfirmPassword('');
    }
    setIsChangingPassword(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sidebarOrder.indexOf(active.id as string);
      const newIndex = sidebarOrder.indexOf(over.id as string);
      setSidebarOrder(arrayMove(sidebarOrder, oldIndex, newIndex));
    }
  };

  const handleSaveSidebarOrder = async () => {
    await updateSettings({ sidebar_order: sidebarOrder });
    toast.success(t('sidebarOrderSaved'));
  };

  const handleLogout = async () => { await signOut(); navigate('/'); };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be less than 5MB'); return; }
    
    setIsUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await updateSettings({ avatar_url: avatarUrl } as any);
      toast.success(t('profilePictureUpdated') || 'Profile picture updated!');
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast.error('Failed to upload profile picture');
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
  const userCode = user?.id ? user.id.slice(0, 8).toUpperCase() : '';

  const copyCode = () => {
    navigator.clipboard.writeText(userCode);
    toast.success(t('codeCopied') || 'Code copied!');
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Simple back button, no header bar */}
      <div className="container max-w-2xl pt-4 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-xl mb-4">
          <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} />
        </Button>
      </div>

      <div className="container max-w-2xl pb-8 px-4 space-y-8">
        {/* Profile Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('profile')}</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {(settings as any)?.avatar_url ? (
                  <img src={(settings as any).avatar_url} alt="Avatar" className="h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className={cn("h-16 w-16 rounded-full flex items-center justify-center text-white text-xl font-bold", getAvatarColorClass(settings?.avatar_color || 'primary'))}>
                    {IconComponent ? <IconComponent className="h-8 w-8" /> : avatarLetter}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUploadingAvatar ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
              </div>
              <div>
                <p className="font-medium">{settings?.display_name || user?.email}</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            {/* Unique Code */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
              <Hash className="h-4 w-4 text-primary" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('yourUniqueCode') || 'Your Unique Code'}</p>
                <p className="font-mono font-bold text-foreground tracking-widest">{userCode}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={copyCode} className="h-8 w-8 rounded-xl">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('displayName')}</label>
              <div className="flex gap-2">
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('displayName')} className="rounded-xl" />
                <Button onClick={handleSaveDisplayName} className="rounded-xl">{t('save')}</Button>
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('avatarColor')}</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_COLORS.map((color) => (
                  <button key={color.value} onClick={() => updateSettings({ avatar_color: color.value })}
                    className={cn("h-10 w-10 rounded-full flex items-center justify-center transition-transform hover:scale-110", color.class, settings?.avatar_color === color.value && "ring-2 ring-offset-2 ring-primary")}>
                    {settings?.avatar_color === color.value && <Check className="h-5 w-5 text-white" />}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <label className="text-sm font-medium">{t('avatarIcon')}</label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_ICONS.map((icon) => {
                  const Icon = icon.value ? ICON_MAP[icon.value] : null;
                  return (
                    <button key={icon.value || 'none'} onClick={() => updateSettings({ avatar_icon: icon.value })}
                      className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-secondary transition-transform hover:scale-110", settings?.avatar_icon === icon.value && "ring-2 ring-primary")}>
                      {Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs">None</span>}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <label className="text-sm font-medium">{t('changePassword')}</label>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <Input type={showPasswords ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('newPassword')} className="rounded-xl pr-10" />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className={cn("absolute top-1/2 -translate-y-1/2 text-muted-foreground", isRTL ? "left-3" : "right-3")}>
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Input type={showPasswords ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder={t('confirmPassword')} className="rounded-xl" />
                <Button onClick={handleChangePassword} disabled={!newPassword || !confirmPassword || isChangingPassword} className="w-full rounded-xl">
                  {isChangingPassword ? t('changingPassword') : t('changePassword')}
                </Button>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Language Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('language')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('languageDesc')}</p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGE_INFO.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3 border-2 transition-all text-sm",
                  language === lang.code
                    ? "border-primary bg-primary/10 font-medium"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-xl">{lang.flag}</span>
                <div className="text-left">
                  <p className="font-medium">{lang.nativeName}</p>
                  <p className="text-xs text-muted-foreground">{lang.name}</p>
                </div>
                {language === lang.code && <Check className="h-4 w-4 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </motion.section>

        {/* Theme Section */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('appearance')}</h2>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings?.theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
              <div>
                <p className="font-medium">{t('darkMode')}</p>
                <p className="text-sm text-muted-foreground">{settings?.theme === 'dark' ? t('darkEnabled') : t('lightEnabled')}</p>
              </div>
            </div>
            <Switch checked={settings?.theme === 'dark'} onCheckedChange={async () => { const newTheme = settings?.theme === 'dark' ? 'light' : 'dark'; await updateSettings({ theme: newTheme }); }} />
          </div>
        </motion.section>

        {/* Sidebar Order */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-6">
            <GripVertical className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('sidebarOrder')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('sidebarDrag')}</p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sidebarOrder} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {sidebarOrder.map((id) => <SortableItem key={id} id={id} label={SIDEBAR_LABELS[id] || id} />)}
              </div>
            </SortableContext>
          </DndContext>
          <Button onClick={handleSaveSidebarOrder} className="w-full mt-4 rounded-xl">{t('saveSidebarOrder')}</Button>
        </motion.section>

        {/* Technical Support */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <Headphones className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{t('technicalSupport')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('supportDesc') || 'Need help? Create a support ticket and our team will assist you.'}</p>
          <Button variant="outline" onClick={() => navigate('/support')} className="w-full rounded-xl gap-2">
            <Headphones className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-1")} />
            {t('technicalSupport')}
            <ChevronRight className={cn("h-4 w-4 ml-auto", isRTL && "rotate-180")} />
          </Button>
        </motion.section>

        {/* Logout */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center gap-3 mb-4">
            <LogOut className="h-5 w-5 text-destructive" />
            <h2 className="text-lg font-semibold">{t('account')}</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{t('signOutDesc')}</p>
          <Button variant="destructive" onClick={handleLogout} className="w-full rounded-xl">
            <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t('signOut')}
          </Button>
        </motion.section>
      </div>
    </div>
  );
}
