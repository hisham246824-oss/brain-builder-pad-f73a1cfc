import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, Video, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function UploadVideoPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!user || !videoFile || !title.trim()) {
        throw new Error('Missing required fields');
      }

      // Upload video
      const videoPath = `${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoPath, videoFile);
      if (videoError) throw videoError;

      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoPath);

      // Upload cover if provided
      let coverUrl = null;
      if (coverFile) {
        const coverPath = `${user.id}/covers/${Date.now()}-${coverFile.name}`;
        const { error: coverError } = await supabase.storage
          .from('videos')
          .upload(coverPath, coverFile);
        if (coverError) throw coverError;

        const { data: coverUrlData } = supabase.storage
          .from('videos')
          .getPublicUrl(coverPath);
        coverUrl = coverUrlData.publicUrl;
      }

      // Insert video record
      const { error: insertError } = await supabase.from('videos').insert({
        user_id: user.id,
        title: title.trim(),
        video_url: videoUrlData.publicUrl,
        cover_url: coverUrl,
        duration: Math.round(videoDuration),
      });
      if (insertError) throw insertError;

      // Track activity
      await supabase.rpc('increment_activity', {
        p_user_id: user.id,
        p_activity_type: 'video_uploaded',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video uploaded successfully!');
      navigate('/podcast');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Failed to upload video');
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoPreview(url);

      // Get video duration
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setVideoDuration(video.duration);
        URL.revokeObjectURL(url);
      };
      video.src = url;
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = () => {
    if (!videoFile) {
      toast.error('Please select a video');
      return;
    }
    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }
    if (!coverFile) {
      toast.error('Please add a cover image');
      return;
    }
    uploadMutation.mutate();
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to upload videos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Upload Video</h1>

        <div className="bg-card border border-border rounded-3xl p-6 shadow-lg space-y-6">
          {/* Video Upload */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Select Video
            </label>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              onChange={handleVideoSelect}
              className="hidden"
            />
            
            {videoPreview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                <video
                  src={videoPreview}
                  className="w-full h-full object-cover"
                  controls
                />
                <button
                  onClick={() => {
                    setVideoFile(null);
                    setVideoPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => videoInputRef.current?.click()}
                className="w-full aspect-video rounded-2xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Video className="h-8 w-8 text-primary" />
                </div>
                <span className="text-muted-foreground font-medium">Click to upload video</span>
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Video Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title..."
              className="rounded-xl"
            />
          </div>

          {/* Cover Upload (Required) */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Cover Image <span className="text-destructive">*</span>
            </label>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverSelect}
              className="hidden"
            />
            
            {coverPreview ? (
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-muted">
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => {
                    setCoverFile(null);
                    setCoverPreview(null);
                  }}
                  className="absolute top-2 right-2 p-2 bg-background/80 rounded-full hover:bg-background transition-colors"
                >
                  <X className="h-4 w-4 text-foreground" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 rounded-2xl border-2 border-dashed border-border bg-muted/50 hover:bg-muted transition-colors flex flex-col items-center justify-center gap-2"
              >
                <Image className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Add cover image</span>
              </button>
            )}
          </div>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !videoFile || !coverFile}
            className="w-full rounded-2xl py-6 text-lg font-semibold"
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-5 w-5 mr-2" />
                Upload Video
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
