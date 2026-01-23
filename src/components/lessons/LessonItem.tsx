import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position: number | null;
  notes: string | null;
}

interface LessonItemProps {
  lesson: Lesson;
  materialColor: string;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
  index: number;
}

export function LessonItem({ lesson, materialColor, onToggle, onDelete, onUpdateNotes, index }: LessonItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(lesson.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update local notes when lesson.notes changes (e.g., from sync)
  useEffect(() => {
    setNotes(lesson.notes || '');
  }, [lesson.notes]);

  // Auto-save notes with debounce
  const handleNotesChange = (value: string) => {
    setNotes(value);
    setIsSaving(true);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = setTimeout(() => {
      onUpdateNotes(value);
      setIsSaving(false);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't toggle if clicking on buttons or textarea
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('textarea') ||
      target.tagName === 'BUTTON' ||
      target.tagName === 'TEXTAREA'
    ) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`group rounded-2xl bg-card shadow-card transition-all hover:shadow-soft ${
        lesson.completed ? 'opacity-70' : ''
      }`}
    >
      {/* Main lesson row */}
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 p-4 cursor-pointer"
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${
            lesson.completed
              ? 'border-success bg-success text-success-foreground'
              : 'border-border hover:border-primary'
          }`}
        >
          {lesson.completed && <Check className="h-4 w-4" />}
        </button>

        <span
          className={`flex-1 font-medium transition-all ${
            lesson.completed
              ? 'text-muted-foreground line-through'
              : 'text-card-foreground'
          }`}
        >
          {lesson.title}
        </span>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        {/* Expand/Collapse indicator */}
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
          
          {/* Color indicator */}
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ backgroundColor: lesson.completed ? 'hsl(var(--success))' : materialColor }}
          />
        </div>
      </div>

      {/* Expandable notes section */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">
              <div className="rounded-2xl bg-gradient-to-br from-background to-muted/20 border border-border/50 p-4 shadow-inner">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Add your notes here..."
                  className="min-h-[100px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-sm leading-relaxed"
                  dir="auto"
                />
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-border/30">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-8 px-4 text-xs font-medium hover:bg-muted/50 rounded-lg"
                  >
                    Hide
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
