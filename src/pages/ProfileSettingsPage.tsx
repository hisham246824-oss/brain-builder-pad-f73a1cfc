import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, User, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, displayName: currentDisplayName } = useAuth();
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch current profile data
  useState(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (data) {
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url);
      }
      setIsFetchingProfile(false);
    };
    
    fetchProfile();
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image must be less than 2MB');
        return;
      }
      
      setAvatarFile(file);
      // Preview the image
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      let finalAvatarUrl = avatarUrl;
      
      // Upload avatar if a new file was selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('material-files')
          .upload(filePath, avatarFile, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('material-files')
          .getPublicUrl(filePath);
        
        finalAvatarUrl = publicUrl;
      }
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim(),
          avatar_url: finalAvatarUrl,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      toast.success('Profile updated successfully!');
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Please sign in to access settings
        </h2>
        <Button onClick={() => navigate('/auth')} className="rounded-xl">
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto"
    >
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="rounded-3xl bg-card p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-card-foreground mb-6">
          Profile Settings
        </h1>

        {isFetchingProfile ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-secondary overflow-hidden flex items-center justify-center">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Profile"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Click to upload a new photo
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Display Name
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="rounded-xl"
                maxLength={50}
                dir="auto"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-2 block text-sm font-medium text-card-foreground">
                Email
              </label>
              <Input
                value={user.email || ''}
                disabled
                className="rounded-xl bg-muted"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isLoading || !displayName.trim()}
              className="w-full rounded-xl"
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
