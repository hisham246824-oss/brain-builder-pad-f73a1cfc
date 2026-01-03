import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Video, Trash2, ThumbsUp, MessageCircle, Eye, 
  Calendar, Clock, MoreVertical, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface VideoWithStats {
  id: string;
  title: string;
  video_url: string;
  cover_url: string | null;
  duration: number;
  views_count: number;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export default function MyVideosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);

  // Fetch user's videos with stats
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['my-videos', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: videosData, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Get likes and comments count for each video
      const videoIds = videosData.map(v => v.id);
      
      const [likesRes, commentsRes] = await Promise.all([
        supabase
          .from('video_likes')
          .select('video_id')
          .in('video_id', videoIds)
          .eq('is_like', true),
        supabase
          .from('video_comments')
          .select('video_id')
          .in('video_id', videoIds),
      ]);

      const likesCount = new Map<string, number>();
      const commentsCount = new Map<string, number>();

      likesRes.data?.forEach(l => {
        likesCount.set(l.video_id, (likesCount.get(l.video_id) || 0) + 1);
      });
      commentsRes.data?.forEach(c => {
        commentsCount.set(c.video_id, (commentsCount.get(c.video_id) || 0) + 1);
      });

      return videosData.map(v => ({
        ...v,
        likes_count: likesCount.get(v.id) || 0,
        comments_count: commentsCount.get(v.id) || 0,
      })) as VideoWithStats[];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase.from('videos').delete().eq('id', videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-videos'] });
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast.success('Video deleted successfully');
      setDeleteVideoId(null);
    },
    onError: () => toast.error('Failed to delete video'),
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <h2 className="text-2xl font-bold text-foreground mb-2">Sign in Required</h2>
        <p className="text-muted-foreground">Please sign in to view your videos.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">My Videos</h1>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading...</div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <Video className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">You haven't uploaded any videos yet</p>
            <Button onClick={() => navigate('/upload-video')} className="rounded-xl">
              Upload Your First Video
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {videos.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Thumbnail */}
                    <div 
                      className="relative sm:w-48 aspect-video sm:aspect-auto sm:h-32 cursor-pointer flex-shrink-0"
                      onClick={() => navigate(`/podcast/${video.id}`)}
                    >
                      {video.cover_url ? (
                        <img
                          src={video.cover_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Video className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-background/90 text-foreground text-xs font-medium px-1.5 py-0.5 rounded">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h3 
                          className="font-semibold text-foreground hover:text-primary cursor-pointer transition-colors"
                          onClick={() => navigate(`/podcast/${video.id}`)}
                        >
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(video.created_at), 'MMM d, yyyy')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {video.views_count} views
                          </span>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1.5 text-sm text-foreground">
                            <ThumbsUp className="h-4 w-4 text-primary" />
                            {video.likes_count}
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-foreground">
                            <MessageCircle className="h-4 w-4 text-primary" />
                            {video.comments_count}
                          </span>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 rounded-lg hover:bg-muted transition-colors">
                            <MoreVertical className="h-5 w-5 text-muted-foreground" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => setDeleteVideoId(video.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Video
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Video
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone.
              All comments and likes will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteVideoId && deleteMutation.mutate(deleteVideoId)}
              className="rounded-xl bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
