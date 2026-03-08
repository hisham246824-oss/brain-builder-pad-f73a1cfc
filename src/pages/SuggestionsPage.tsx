import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Plus, ThumbsUp, Send, X, Sparkles, Star, Heart, Zap, Crown, Flame, Rocket, Diamond } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSuggestions } from '@/hooks/useSuggestions';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  star: Star, heart: Heart, zap: Zap, crown: Crown, flame: Flame, rocket: Rocket, diamond: Diamond,
};

const COLOR_MAP: Record<string, string> = {
  primary: 'bg-primary', red: 'bg-red-500', orange: 'bg-orange-500', yellow: 'bg-yellow-500',
  green: 'bg-green-500', teal: 'bg-teal-500', blue: 'bg-blue-500', purple: 'bg-purple-500',
  pink: 'bg-pink-500', slate: 'bg-slate-500',
};

const PAGE_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'materials', label: 'Study Materials' },
  { value: 'vocabulary', label: 'Vocabulary' },
  { value: 'pomodoro', label: 'Pomodoro Timer' },
  { value: 'table-creator', label: 'Create Table' },
  { value: 'messages', label: 'Messages' },
  { value: 'settings', label: 'Settings' },
  { value: 'suggestions', label: 'Suggestions' },
];

const ACCENT_COLORS = [
  'from-primary/10 to-accent/20 border-primary/20',
  'from-blue-500/10 to-cyan-500/10 border-blue-500/20',
  'from-purple-500/10 to-pink-500/10 border-purple-500/20',
  'from-green-500/10 to-teal-500/10 border-green-500/20',
  'from-orange-500/10 to-yellow-500/10 border-orange-500/20',
];

export default function SuggestionsPage() {
  const { user } = useAuth();
  const { suggestions, isLoading, addSuggestion, toggleVote } = useSuggestions();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetPage, setTargetPage] = useState('general');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    setIsSubmitting(true);
    const fullDescription = `[${PAGE_OPTIONS.find(p => p.value === targetPage)?.label || 'General'}] ${description}`;
    const success = await addSuggestion(title.trim(), fullDescription);
    if (success) {
      setTitle('');
      setDescription('');
      setTargetPage('general');
      setShowAddDialog(false);
    }
    setIsSubmitting(false);
  };

  const getAvatarContent = (suggestion: any) => {
    const IconComponent = suggestion.user_avatar_icon ? ICON_MAP[suggestion.user_avatar_icon] : null;
    const letter = suggestion.user_display_name?.[0]?.toUpperCase() || '?';
    const colorClass = COLOR_MAP[suggestion.user_avatar_color || 'primary'] || 'bg-primary';
    
    return (
      <div className={cn("flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-medium shrink-0", colorClass)}>
        {IconComponent ? <IconComponent className="h-3.5 w-3.5" /> : letter}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Lightbulb className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Suggestions</h1>
            <p className="text-sm text-muted-foreground">Help us improve the platform</p>
          </div>
        </div>

        {user && (
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              onClick={() => setShowAddDialog(true)}
              className="rounded-2xl gap-2 shadow-soft"
            >
              <Plus className="h-4 w-4" />
              Add Suggestion
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Suggestions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-3xl bg-card shadow-card p-12 text-center"
        >
          <Sparkles className="mx-auto h-16 w-16 text-muted-foreground/50" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">No suggestions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Be the first to share your ideas!</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((suggestion, index) => {
              const accentClass = ACCENT_COLORS[index % ACCENT_COLORS.length];
              const pageTag = suggestion.description.match(/^\[([^\]]+)\]/)?.[1];
              const cleanDescription = suggestion.description.replace(/^\[[^\]]+\]\s*/, '');
              
              return (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.04 }}
                  layout
                  className={cn(
                    "rounded-2xl border bg-gradient-to-br p-5 transition-all hover:shadow-soft",
                    accentClass
                  )}
                >
                  {/* User info header */}
                  <div className="flex items-center gap-2 mb-3">
                    {getAvatarContent(suggestion)}
                    <span className="text-xs font-medium text-muted-foreground">
                      {suggestion.user_display_name || 'Anonymous'}
                    </span>
                    <span className="text-xs text-muted-foreground/50">·</span>
                    <span className="text-xs text-muted-foreground/50">
                      {new Date(suggestion.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                    {pageTag && (
                      <>
                        <span className="text-xs text-muted-foreground/50">·</span>
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {pageTag}
                        </span>
                      </>
                    )}
                    {suggestion.status === 'accepted' && (
                      <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
                        ✓ Accepted
                      </span>
                    )}
                  </div>

                  {/* Suggestion content */}
                  <h3 className="font-semibold text-foreground mb-1.5">{suggestion.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    {cleanDescription}
                  </p>

                  {/* Support button */}
                  {user && (
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleVote(suggestion.id)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-4 py-2.5 transition-all duration-200 border",
                        suggestion.has_voted
                          ? "bg-primary/10 border-primary/30 text-primary"
                          : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <ThumbsUp className={cn("h-4 w-4", suggestion.has_voted && "fill-current")} />
                        <span className="text-sm font-medium">
                          {suggestion.has_voted ? 'Supported' : 'Support this idea'}
                        </span>
                      </div>
                      {suggestion.has_voted && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="text-sm font-bold"
                        >
                          {suggestion.votes_count}
                        </motion.span>
                      )}
                    </motion.button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Add Suggestion Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Share Your Idea
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Title</label>
              <Input
                placeholder="Brief title for your suggestion..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Related Page</label>
              <Select value={targetPage} onValueChange={setTargetPage}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">Description</label>
              <Textarea
                placeholder="Describe your suggestion in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-xl min-h-[100px] resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={!title.trim() || !description.trim() || isSubmitting}
              className="w-full rounded-xl gap-2"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Submitting...' : 'Submit Suggestion'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
