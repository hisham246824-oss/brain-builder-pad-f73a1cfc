import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RichTextEditor } from './RichTextEditor';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position: number | null;
  notes: string | null;
}

interface SortableLessonItemProps {
  lesson: Lesson;
  materialColor: string;
  onToggle: () => void;
  onDelete: () => void;
  onUpdateNotes: (notes: string) => void;
  index: number;
}

export function SortableLessonItem({ 
  lesson, 
  materialColor, 
  onToggle, 
  onDelete, 
  onUpdateNotes, 
  index 
}: SortableLessonItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [notes, setNotes] = useState(lesson.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lesson.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };
  
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
    // Don't toggle if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (
      target.closest('button') || 
      target.closest('[data-drag-handle]') ||
      target.closest('.ProseMirror') ||
      target.tagName === 'BUTTON'
    ) {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group rounded-2xl bg-card shadow-card transition-all hover:shadow-soft ${
        lesson.completed ? 'opacity-70' : ''
      } ${isDragging ? 'shadow-lg scale-[1.02] opacity-90' : ''}`}
    >
      {/* Main lesson row */}
      <div
        onClick={handleCardClick}
        className="flex items-center gap-3 p-4 cursor-pointer"
      >
        {/* Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          data-drag-handle
          className="flex h-8 w-6 cursor-grab items-center justify-center text-muted-foreground hover:text-foreground active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-4 w-4" />
        </div>

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

      {/* Expandable notes section with rich text */}
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
              <div className="rounded-xl bg-background border border-border p-3">
                <RichTextEditor
                  content={notes}
                  onChange={handleNotesChange}
                  placeholder="أضف ملاحظاتك هنا..."
                />
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">
                    {isSaving ? 'جاري الحفظ...' : notes ? 'تم الحفظ تلقائياً' : ''}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(false)}
                    className="h-7 text-xs"
                  >
                    إخفاء
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
