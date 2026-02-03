import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ThumbsUp, 
  Check, 
  X,
  User,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

interface Suggestion {
  id: string;
  user_id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  votes_count: number;
  user_display_name: string | null;
  user_email: string | null;
}

interface SuggestionsPanelProps {
  suggestions: Suggestion[];
  isLoading: boolean;
  onAccept: (suggestionId: string, userId: string) => Promise<boolean>;
  onReject: (suggestionId: string) => Promise<boolean>;
}

export function SuggestionsPanel({
  suggestions,
  isLoading,
  onAccept,
  onReject,
}: SuggestionsPanelProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'reject' | null>(null);

  const handleAction = async () => {
    if (!selectedSuggestion || !actionType) return;

    if (actionType === 'accept') {
      await onAccept(selectedSuggestion.id, selectedSuggestion.user_id);
    } else {
      await onReject(selectedSuggestion.id);
    }

    setSelectedSuggestion(null);
    setActionType(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-600">
            <Check className="h-3 w-3" />
            مقبول
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-600">
            <X className="h-3 w-3" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-xs font-medium text-yellow-600">
            <Lightbulb className="h-3 w-3" />
            قيد المراجعة
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl font-bold text-foreground"
      >
        اقتراحات المستخدمين
      </motion.h2>

      {suggestions.length === 0 ? (
        <div className="rounded-xl bg-secondary/50 p-12 text-center">
          <Lightbulb className="mx-auto h-16 w-16 text-muted-foreground" />
          <p className="mt-4 text-lg text-muted-foreground">لا توجد اقتراحات بعد</p>
          <p className="mt-1 text-sm text-muted-foreground">
            سيظهر هنا اقتراحات المستخدمين عندما يقومون بإرسالها
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {suggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={cn(
                  'overflow-hidden transition-all',
                  suggestion.status === 'pending' && 'border-yellow-500/30'
                )}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-foreground">
                            {suggestion.title}
                          </h3>
                          {getStatusBadge(suggestion.status)}
                        </div>
                        
                        <p className="mt-2 text-muted-foreground leading-relaxed">
                          {suggestion.description}
                        </p>

                        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            {suggestion.user_display_name || 'مستخدم'}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            {new Date(suggestion.created_at).toLocaleDateString('ar-EG')}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <ThumbsUp className="h-4 w-4" />
                            {suggestion.votes_count} تصويت
                          </div>
                        </div>
                      </div>

                      {/* Vote indicator */}
                      <div className="flex flex-col items-center rounded-xl bg-primary/10 px-4 py-3">
                        <ThumbsUp className="h-5 w-5 text-primary" />
                        <span className="mt-1 text-lg font-bold text-primary">
                          {suggestion.votes_count}
                        </span>
                      </div>
                    </div>

                    {/* Actions for pending suggestions */}
                    {suggestion.status === 'pending' && (
                      <div className="mt-4 flex gap-2 border-t border-border pt-4">
                        <Button
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setActionType('accept');
                          }}
                          className="flex-1 gap-2"
                          variant="default"
                        >
                          <Check className="h-4 w-4" />
                          قبول الاقتراح
                        </Button>
                        <Button
                          onClick={() => {
                            setSelectedSuggestion(suggestion);
                            setActionType('reject');
                          }}
                          className="flex-1 gap-2"
                          variant="outline"
                        >
                          <X className="h-4 w-4" />
                          رفض
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={!!selectedSuggestion && !!actionType} 
        onOpenChange={() => {
          setSelectedSuggestion(null);
          setActionType(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'accept' ? 'تأكيد قبول الاقتراح' : 'تأكيد رفض الاقتراح'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'accept' 
                ? 'سيتم إرسال رسالة شكر تلقائية للمستخدم عند قبول اقتراحه.'
                : 'هل أنت متأكد من رفض هذا الاقتراح؟ سيتم حذفه نهائياً.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              className={actionType === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {actionType === 'accept' ? 'قبول' : 'رفض'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
