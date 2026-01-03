import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Pencil, Play, MoreVertical, Download, Clock, User, Eye, Calendar, ThumbsUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Video {
  id: string;
  title: string;
  video_url: string;
  cover_url: string | null;
  duration: number;
  views_count: number;
  user_id: string;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  likes_count?: number;
}

export default function PodcastPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all videos with publisher info and likes count
  const { data: videos = [] } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      const { data: videosData, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      // Fetch profiles for each video
      const userIds = [...new Set(videosData.map(v => v.user_id))];
      const videoIds = videosData.map(v => v.id);

      const [profilesRes, likesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', userIds),
        supabase
          .from('video_likes')
          .select('video_id')
          .in('video_id', videoIds)
          .eq('is_like', true),
      ]);
      
      const profileMap = new Map(profilesRes.data?.map(p => [p.user_id, p]) || []);
      
      const likesCount = new Map<string, number>();
      likesRes.data?.forEach(l => {
        likesCount.set(l.video_id, (likesCount.get(l.video_id) || 0) + 1);
      });
      
      return videosData.map(v => ({
        ...v,
        profiles: profileMap.get(v.user_id) || null,
        likes_count: likesCount.get(v.id) || 0,
      })) as Video[];
    },
  });

  // Filter videos based on search
  const filteredVideos = useMemo(() => {
    if (!searchQuery.trim()) return videos;
    const query = searchQuery.toLowerCase();
    return videos.filter((video) =>
      video.title.toLowerCase().includes(query) ||
      video.profiles?.display_name?.toLowerCase().includes(query)
    );
  }, [videos, searchQuery]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = async (video: Video) => {
    window.open(video.video_url, '_blank');
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <h1 className="text-3xl font-bold text-foreground mb-6 text-center">Podcast</h1>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex items-center bg-card border border-border rounded-full px-4 py-3 shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Search className="h-5 w-5 text-muted-foreground mr-3 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search podcasts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
            />
            <Pencil className="h-5 w-5 text-muted-foreground ml-3 flex-shrink-0" />
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredVideos.map((video, index) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card border border-border rounded-2xl overflow-hidden shadow-md hover:shadow-lg transition-all group cursor-pointer"
                onClick={() => navigate(`/podcast/${video.id}`)}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  {video.cover_url ? (
                    <img
                      src={video.cover_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                      <Play className="h-12 w-12 text-primary/50" />
                    </div>
                  )}
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-background/90 text-foreground text-xs font-medium px-2 py-1 rounded-md flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(video.duration || 0)}
                  </div>

                  {/* Play Overlay */}
                  <div className="absolute inset-0 bg-background/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary-foreground ml-1" />
                    </div>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{video.title}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                          {video.profiles?.avatar_url ? (
                            <img
                              src={video.profiles.avatar_url}
                              alt=""
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <User className="h-3 w-3 text-primary" />
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground truncate">
                          {video.profiles?.display_name || 'Anonymous'}
                        </span>
                      </div>
                      
                      {/* Additional Details */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {video.views_count || 0} views
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {video.likes_count || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(video.created_at), 'MMM d')}
                        </span>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                      >
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(video);
                        }}>
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredVideos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            {searchQuery ? 'No podcasts found matching your search' : 'No podcasts yet. Be the first to upload!'}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
