import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Heart,
  Check,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminMessages } from '@/hooks/useAdminMessages';

export default function MessagesPage() {
  const { 
    messages, 
    isLoading, 
    toggleLike,
    markAllAsRead 
  } = useAdminMessages();

  useEffect(() => {
    // Mark all messages as read when page is viewed
    markAllAsRead();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Mail className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-secondary" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary shadow-glow">
          <Mail className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Messages from Admin</h1>
          <p className="text-sm text-muted-foreground">
            {messages.length} {messages.length === 1 ? 'message' : 'messages'}
          </p>
        </div>
      </motion.div>

      {messages.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl bg-secondary/50 p-12 text-center"
        >
          <Mail className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg font-medium text-foreground">No messages</p>
          <p className="mt-1 text-muted-foreground">
            Messages from the site admin will appear here
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ 
                  delay: index * 0.05,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20
                }}
                layout
              >
                <Card className="overflow-hidden transition-all hover:shadow-lg">
                  <CardContent className="p-0">
                    {/* Message bubble effect */}
                    <div className="relative">
                      {/* Gradient accent */}
                      <div className="absolute left-0 top-0 h-full w-1 gradient-primary" />
                      
                      <div className="p-5 pl-6">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full gradient-primary">
                              <Mail className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">
                                {message.title || 'Message from Admin'}
                              </h3>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(message.created_at).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>

                          {message.isRead && (
                            <div className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-600">
                              <Check className="h-3 w-3" />
                              Read
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="mt-4 rounded-xl bg-secondary/50 p-4">
                          <p className="whitespace-pre-wrap leading-relaxed text-foreground">
                            {message.content}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 flex items-center justify-between">
                          <Button
                            variant={message.isLiked ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleLike(message.id)}
                            className="gap-2 transition-all"
                          >
                            <Heart 
                              className={`h-4 w-4 transition-all ${
                                message.isLiked ? 'fill-current' : ''
                              }`} 
                            />
                            {message.isLiked ? 'Liked' : 'Like'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
