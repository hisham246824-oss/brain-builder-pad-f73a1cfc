import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, CheckCircle2, Circle, BookOpen, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LessonItem } from '@/components/lessons/LessonItem';
import { AddLessonForm } from '@/components/lessons/AddLessonForm';
import { FileList } from '@/components/materials/FileList';
import { IconSelector, getMaterialIcon } from '@/components/materials/IconSelector';
import { SortableList } from '@/components/dnd/SortableList';
import { SortableItem } from '@/components/dnd/SortableItem';
import { useStudyData } from '@/contexts/StudyDataContext';

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getMaterial, addLesson, toggleLesson, deleteLesson, deleteMaterial, addFile, deleteFile, updateMaterialIcon, reorderLessons } = useStudyData();
  const [activeTab, setActiveTab] = useState<'lessons' | 'files'>('lessons');
  const [showIconSelector, setShowIconSelector] = useState(false);

  const material = getMaterial(id || '');

  if (!material) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Material not found
        </h2>
        <Link to="/materials">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Materials
          </Button>
        </Link>
      </div>
    );
  }

  const completedCount = material.lessons.filter((l) => l.completed).length;
  const totalCount = material.lessons.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this material and all its lessons?')) {
      deleteMaterial(material.id);
      navigate('/materials');
    }
  };

  const handleReorderLessons = (oldIndex: number, newIndex: number) => {
    reorderLessons(material.id, oldIndex, newIndex);
  };

  const MaterialIcon = getMaterialIcon(material.icon || 'book');

  return (
    <div>
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Link
          to="/materials"
          className="mb-6 inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Materials</span>
        </Link>
      </motion.div>

      {/* Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-8 overflow-hidden rounded-3xl bg-card p-6 shadow-soft"
      >
        <div
          className="absolute left-0 top-0 h-full w-2"
          style={{ backgroundColor: material.color }}
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 pl-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowIconSelector(true)}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl cursor-pointer transition-shadow hover:shadow-lg"
              style={{ backgroundColor: material.color }}
              title="Click to change icon"
            >
              <MaterialIcon className="h-6 w-6 text-primary-foreground" />
            </motion.button>

            <div>
              <h1 className="text-2xl font-bold text-card-foreground">
                {material.title}
              </h1>
              {material.description && (
                <p className="mt-1 text-muted-foreground">
                  {material.description}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleDelete}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress */}
        <div className="mt-6 pl-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-success">
                <CheckCircle2 className="h-4 w-4" />
                {completedCount} completed
              </span>
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Circle className="h-4 w-4" />
                {totalCount - completedCount} remaining
              </span>
            </div>
            <span className="font-medium text-card-foreground">
              {Math.round(progress)}%
            </span>
          </div>

          <div className="mt-2 h-3 overflow-hidden rounded-full bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full rounded-full"
              style={{ backgroundColor: material.color }}
            />
          </div>
        </div>
      </motion.div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'lessons' ? 'default' : 'outline'}
          onClick={() => setActiveTab('lessons')}
          className="flex-1 rounded-xl"
        >
          <BookOpen className="mr-2 h-4 w-4" />
          Lessons ({material.lessons.length})
        </Button>
        <Button
          variant={activeTab === 'files' ? 'default' : 'outline'}
          onClick={() => setActiveTab('files')}
          className="flex-1 rounded-xl"
        >
          <FolderOpen className="mr-2 h-4 w-4" />
          Files ({material.files?.length || 0})
        </Button>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'lessons' ? (
          <motion.div
            key="lessons"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-3"
          >
            {material.lessons.length > 0 && (
              <SortableList
                items={material.lessons.map((l) => l.id)}
                onReorder={handleReorderLessons}
              >
                {material.lessons.map((lesson, index) => (
                  <SortableItem key={lesson.id} id={lesson.id}>
                    <LessonItem
                      lesson={lesson}
                      materialColor={material.color}
                      onToggle={() => toggleLesson(material.id, lesson.id)}
                      onDelete={() => deleteLesson(material.id, lesson.id)}
                      index={index}
                    />
                  </SortableItem>
                ))}
              </SortableList>
            )}

            <AddLessonForm onAdd={(title) => addLesson(material.id, title)} />
          </motion.div>
        ) : (
          <motion.div
            key="files"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <FileList
              files={material.files || []}
              onAddFile={(file, customName) => addFile(material.id, file, customName)}
              onDeleteFile={(fileId) => deleteFile(material.id, fileId)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Icon Selector Dialog */}
      <IconSelector
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        currentIcon={material.icon || 'book'}
        onSelect={(icon) => updateMaterialIcon(material.id, icon)}
        color={material.color}
      />
    </div>
  );
}
