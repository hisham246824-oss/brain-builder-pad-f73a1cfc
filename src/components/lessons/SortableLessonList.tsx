import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableLessonItem } from './SortableLessonItem';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position: number | null;
  notes: string | null;
}

interface SortableLessonListProps {
  lessons: Lesson[];
  materialId: string;
  materialColor: string;
  onToggle: (lessonId: string) => void;
  onDelete: (lessonId: string) => void;
  onUpdateNotes: (lessonId: string, notes: string) => void;
  onReorder: (lessonIds: string[]) => void;
}

export function SortableLessonList({
  lessons,
  materialId,
  materialColor,
  onToggle,
  onDelete,
  onUpdateNotes,
  onReorder,
}: SortableLessonListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = lessons.findIndex((l) => l.id === active.id);
      const newIndex = lessons.findIndex((l) => l.id === over.id);
      const newOrder = arrayMove(lessons, oldIndex, newIndex);
      onReorder(newOrder.map((l) => l.id));
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={lessons.map((l) => l.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <SortableLessonItem
              key={lesson.id}
              lesson={lesson}
              materialColor={materialColor}
              onToggle={() => onToggle(lesson.id)}
              onDelete={() => onDelete(lesson.id)}
              onUpdateNotes={(notes) => onUpdateNotes(lesson.id, notes)}
              index={index}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
