import { motion } from 'framer-motion';
import { Check, Trash2 } from 'lucide-react';
import { Lesson } from '@/types/study';

interface LessonItemProps {
  lesson: Lesson;
  materialColor: string;
  onToggle: () => void;
  onDelete: () => void;
  index: number;
}

export function LessonItem({ lesson, materialColor, onToggle, onDelete, index }: LessonItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20, height: 0 }}
      transition={{ delay: index * 0.05 }}
      layout
      className={`group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card transition-all hover:shadow-soft ${
        lesson.completed ? 'opacity-70' : ''
      }`}
    >
      <button
        onClick={onToggle}
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
        onClick={onDelete}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {/* Color indicator */}
      <div
        className="h-2 w-2 rounded-full shrink-0"
        style={{ backgroundColor: lesson.completed ? 'hsl(var(--success))' : materialColor }}
      />
    </motion.div>
  );
}
