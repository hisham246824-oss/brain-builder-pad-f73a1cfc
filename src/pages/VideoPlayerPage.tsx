import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, ThumbsDown, Play, User, Send, 
  Reply, Trash2, Maximize2, Minimize2, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

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
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  parent_id: string | null;
  created_at: string;
  profiles?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  replies?: Comment[];
}

interface Like {
  id: string;
  user_id: string;
  is_like: boolean;
}

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  // Fetch video
  const { data: video } = useQuery({
    queryKey: ['video', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('user_id', data.user_id)
        .maybeSingle();
      
      return { ...data, profiles: profile } as Video;
    },
    enabled: !!id,
  });

  // Fetch likes
  const { data: likes = [] } = useQuery({
    queryKey: ['video-likes', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_likes')
        .select('*')
        .eq('video_id', id);
      if (error) throw error;
      return data as Like[];
    },
    enabled: !!id,
  });

  // Fetch comments with replies
  const { data: comments = [] } = useQuery({
    queryKey: ['video-comments', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('video_comments')
        .select('*')
        .eq('video_id', id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const commentsWithProfiles = data.map(c => ({
        ...c,
        profiles: profileMap.get(c.user_id) || null,
      })) as Comment[];

      const topLevel: Comment[] = [];
      const repliesMap = new Map<string, Comment[]>();

      commentsWithProfiles.forEach((comment) => {
        if (comment.parent_id) {
          if (!repliesMap.has(comment.parent_id)) {
            repliesMap.set(comment.parent_id, []);
          }
          repliesMap.get(comment.parent_id)!.push(comment);
        } else {
          topLevel.push(comment);
        }
      });

      topLevel.forEach((comment) => {
        comment.replies = repliesMap.get(comment.id) || [];
      });

      return topLevel;
    },
    enabled: !!id,
  });

  // Fetch suggested videos
  const { data: suggestions = [] } = useQuery({
    queryKey: ['video-suggestions', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .neq('id', id)
        .limit(5)
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      const userIds = [...new Set(data.map(v => v.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);
      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);
      
      return data.map(v => ({ ...v, profiles: profileMap.get(v.user_id) || null })) as Video[];
    },
    enabled: !!id,
  });

  const likeCount = likes.filter((l) => l.is_like).length;
  const dislikeCount = likes.filter((l) => !l.is_like).length;
  const userLike = user ? likes.find((l) => l.user_id === user.id) : null;

  // Like/Dislike mutation
  const likeMutation = useMutation({
    mutationFn: async (isLike: boolean) => {
      if (!user || !id) throw new Error('Not authenticated');

      if (userLike) {
        if (userLike.is_like === isLike) {
          // Remove like
          await supabase.from('video_likes').delete().eq('id', userLike.id);
        } else {
          // Update like
          await supabase.from('video_likes').update({ is_like: isLike }).eq('id', userLike.id);
        }
      } else {
        // Create like
        await supabase.from('video_likes').insert({
          video_id: id,
          user_id: user.id,
          is_like: isLike,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['video-likes', id] }),
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (parentId: string | null = null) => {
      if (!user || !id) throw new Error('Not authenticated');
      const content = parentId ? replyContent : newComment;
      
      const { error } = await supabase.from('video_comments').insert({
        video_id: id,
        user_id: user.id,
        content: content.trim(),
        parent_id: parentId,
      });
      if (error) throw error;
    },
    onSuccess: (_, parentId) => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', id] });
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      toast.success('Comment added!');
    },
    onError: () => toast.error('Failed to add comment'),
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase.from('video_comments').delete().eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['video-comments', id] });
      toast.success('Comment deleted');
    },
  });

  const toggleReplies = (commentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Video not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Player */}
            <div className={`relative bg-muted rounded-2xl overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50 rounded-none' : 'aspect-video'}`}>
              <video
                ref={videoRef}
                src={video.video_url}
                className="w-full h-full object-contain bg-black"
                controls
                poster={video.cover_url || undefined}
              />
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="absolute top-4 right-4 p-2 bg-background/80 rounded-lg hover:bg-background transition-colors"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-5 w-5 text-foreground" />
                ) : (
                  <Maximize2 className="h-5 w-5 text-foreground" />
                )}
              </button>
            </div>

            {/* Video Info */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h1 className="text-xl font-bold text-foreground mb-3">{video.title}</h1>
              
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                    {video.profiles?.avatar_url ? (
                      <img src={video.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <span className="font-medium text-foreground">
                    {video.profiles?.display_name || 'Anonymous'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={userLike?.is_like === true ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => user ? likeMutation.mutate(true) : toast.error('Sign in to like')}
                    className="rounded-full"
                  >
                    <ThumbsUp className="h-4 w-4 mr-1" />
                    {likeCount}
                  </Button>
                  <Button
                    variant={userLike?.is_like === false ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => user ? likeMutation.mutate(false) : toast.error('Sign in to dislike')}
                    className="rounded-full"
                  >
                    <ThumbsDown className="h-4 w-4 mr-1" />
                    {dislikeCount}
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <h2 className="font-semibold text-foreground mb-4">Comments ({comments.length})</h2>

              {/* Add Comment */}
              {user ? (
                <div className="flex gap-2 mb-6">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="rounded-xl flex-1"
                  />
                  <Button
                    onClick={() => addCommentMutation.mutate(null)}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="rounded-xl"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground mb-4">Sign in to comment</p>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="space-y-3">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {comment.profiles?.avatar_url ? (
                          <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-foreground">
                            {comment.profiles?.display_name || 'Anonymous'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-1">{comment.content}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {user && (
                            <button
                              onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                            >
                              <Reply className="h-3 w-3" />
                              Reply
                            </button>
                          )}
                          {user?.id === comment.user_id && (
                            <button
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="text-xs text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="h-3 w-3" />
                              Delete
                            </button>
                          )}
                          {comment.replies && comment.replies.length > 0 && (
                            <button
                              onClick={() => toggleReplies(comment.id)}
                              className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                            >
                              {expandedReplies.has(comment.id) ? (
                                <>
                                  <ChevronUp className="h-3 w-3" />
                                  Hide {comment.replies.length} replies
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="h-3 w-3" />
                                  Show {comment.replies.length} replies
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Reply Form */}
                        <AnimatePresence>
                          {replyingTo === comment.id && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex gap-2 mt-3"
                            >
                              <Input
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Write a reply..."
                                className="rounded-xl flex-1 text-sm"
                                autoFocus
                              />
                              <Button
                                size="sm"
                                onClick={() => addCommentMutation.mutate(comment.id)}
                                disabled={!replyContent.trim()}
                                className="rounded-xl"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Replies */}
                        <AnimatePresence>
                          {expandedReplies.has(comment.id) && comment.replies && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="space-y-3 mt-3 pl-4 border-l-2 border-border"
                            >
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="flex gap-2">
                                  <div className="w-6 h-6 rounded-full bg-primary/20 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {reply.profiles?.avatar_url ? (
                                      <img src={reply.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="h-3 w-3 text-primary" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-xs text-foreground">
                                        {reply.profiles?.display_name || 'Anonymous'}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(reply.created_at), 'MMM d')}
                                      </span>
                                      {user?.id === reply.user_id && (
                                        <button
                                          onClick={() => deleteCommentMutation.mutate(reply.id)}
                                          className="text-xs text-destructive hover:text-destructive/80 ml-auto"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-foreground mt-0.5">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Suggestions Sidebar */}
          <div className="space-y-4">
            <h2 className="font-semibold text-foreground">Suggested Videos</h2>
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <motion.div
                  key={suggestion.id}
                  whileHover={{ scale: 1.02 }}
                  className="flex gap-3 bg-card border border-border rounded-xl p-2 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => navigate(`/podcast/${suggestion.id}`)}
                >
                  <div className="w-32 aspect-video rounded-lg bg-muted overflow-hidden flex-shrink-0">
                    {suggestion.cover_url ? (
                      <img src={suggestion.cover_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Play className="h-6 w-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground line-clamp-2">{suggestion.title}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground truncate">
                        {suggestion.profiles?.display_name || 'Anonymous'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
