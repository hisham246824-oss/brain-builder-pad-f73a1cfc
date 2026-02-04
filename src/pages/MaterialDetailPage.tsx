import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Trash2, CheckCircle2, Circle, BookOpen, FolderOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddLessonForm } from '@/components/lessons/AddLessonForm';
import { FileListSupabase } from '@/components/materials/FileListSupabase';
import { IconSelector, getMaterialIcon } from '@/components/materials/IconSelector';
import { MaterialDetailSkeleton } from '@/components/skeletons/MaterialDetailSkeleton';
import { ExpandedLessonEditor } from '@/components/lessons/ExpandedLessonEditor';
import { useStudyDataSupabase } from '@/hooks/useStudyDataSupabase';
import { useAuth } from '@/contexts/AuthContext';

interface Lesson {
  id: string;
  title: string;
  completed: boolean;
  position: number | null;
  notes: string | null;
}

export default function MaterialDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getMaterial, isLoading, addLesson, toggleLesson, deleteLesson, deleteMaterial, updateMaterialIcon, updateLessonNotes, reorderLessons, refetch } = useStudyDataSupabase();
  const [activeTab, setActiveTab] = useState<'lessons' | 'files'>('lessons');
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [expandedLesson, setExpandedLesson] = useState<Lesson | null>(null);

  const material = getMaterial(id || '');

  // Show skeleton while loading
  if (isLoading) {
    return <MaterialDetailSkeleton />;
  }

  // Show sign in message if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Sign in to view materials
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

  const colors = [
    'hsl(175 60% 35%)',
    'hsl(220 70% 50%)',
    'hsl(280 60% 50%)',
    'hsl(340 70% 50%)',
    'hsl(30 80% 50%)',
    'hsl(145 60% 40%)',
  ];
  const materialColor = colors[0]; // Default color

  const completedCount = material.lessons.filter((l) => l.completed).length;
  const totalCount = material.lessons.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this material and all its lessons?')) {
      await deleteMaterial(material.id);
      navigate('/materials');
    }
  };

  const handleLessonClick = (lesson: Lesson) => {
    setExpandedLesson(lesson);
  };

  const handleSaveLessonNotes = (notes: string) => {
    if (expandedLesson) {
      updateLessonNotes(material.id, expandedLesson.id, notes);
    }
  };

  const MaterialIcon = getMaterialIcon(material.icon || 'book');

  return (
    <>
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
            style={{ backgroundColor: materialColor }}
          />

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4 pl-4">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowIconSelector(true)}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl cursor-pointer transition-shadow hover:shadow-lg"
                style={{ backgroundColor: materialColor }}
                title="Click to change icon"
              >
                <MaterialIcon className="h-6 w-6 text-primary-foreground" />
              </motion.button>

              <div>
                <h1 className="text-2xl font-bold text-card-foreground">
                  {material.title}
                </h1>
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
                style={{ backgroundColor: materialColor }}
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
              {/* Lessons List - Clickable cards that open editor */}
              {material.lessons.map((lesson, index) => (
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`group rounded-2xl bg-card shadow-card transition-all hover:shadow-soft cursor-pointer ${
                    lesson.completed ? 'opacity-70' : ''
                  }`}
                  onClick={() => handleLessonClick(lesson)}
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLesson(material.id, lesson.id);
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
                        if (confirm('Delete this lesson?')) {
                          deleteLesson(material.id, lesson.id);
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    {/* Notes indicator + Color dot */}
                    <div className="flex items-center gap-2">
                      {lesson.notes && (
                        <span className="text-xs text-muted-foreground">
                          Has notes
                        </span>
                      )}
                      <div
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: lesson.completed ? 'hsl(var(--success))' : materialColor }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}

              <AddLessonForm onAdd={(title) => addLesson(material.id, title)} />
            </motion.div>
          ) : (
            <motion.div
              key="files"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FileListSupabase
                files={material.files || []}
                materialId={material.id}
                onFileAdded={refetch}
                onFileDeleted={refetch}
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
          color={materialColor}
        />
      </div>

      {/* Expanded Lesson Editor */}
      <AnimatePresence>
        {expandedLesson && (
          <ExpandedLessonEditor
            lesson={expandedLesson}
            materialColor={materialColor}
            materialTitle={material.title}
            onSave={handleSaveLessonNotes}
            onClose={() => setExpandedLesson(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
