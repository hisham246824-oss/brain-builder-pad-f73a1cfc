import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { AddMaterialDialog } from '@/components/materials/AddMaterialDialog';
import { MaterialsSkeleton } from '@/components/skeletons/MaterialsSkeleton';
import { useStudyDataSupabase } from '@/hooks/useStudyDataSupabase';
import { useAuth } from '@/contexts/AuthContext';

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuth();
  const { materials, isLoading, addMaterial, updateMaterialIcon } = useStudyDataSupabase();

  // Show sign-in prompt if not authenticated
  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold text-foreground">
          Sign in to view materials
        </h3>
        <p className="text-muted-foreground">
          Create an account to save and sync your study materials
        </p>
      </motion.div>
    );
  }

  if (isLoading) {
    return <MaterialsSkeleton />;
  }

  // Transform materials to match MaterialCard expected format
  const transformedMaterials = materials.map((m, index) => {
    const colors = [
      'hsl(175 60% 35%)',
      'hsl(220 70% 50%)',
      'hsl(280 60% 50%)',
      'hsl(340 70% 50%)',
      'hsl(30 80% 50%)',
      'hsl(145 60% 40%)',
    ];
    return {
      id: m.id,
      title: m.title,
      color: colors[index % colors.length],
      icon: m.icon,
      lessons: m.lessons.map(l => ({
        id: l.id,
        title: l.title,
        completed: l.completed,
        position: l.position,
        notes: l.notes,
        createdAt: Date.now(),
      })),
      files: m.files.map(f => ({
        id: f.id,
        name: f.name,
        type: (f.file_type || 'other') as any,
        url: f.file_url,
        size: f.file_size || 0,
        createdAt: Date.now(),
      })),
      createdAt: Date.now(),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="pb-20"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Study Materials</h1>
        <p className="mt-1 text-muted-foreground">
          {materials.length} {materials.length === 1 ? 'subject' : 'subjects'}
        </p>
      </div>

      <Button
        onClick={() => setIsDialogOpen(true)}
        className="mb-6 w-full rounded-2xl py-6 text-lg font-medium shadow-soft hover:shadow-lg transition-shadow"
      >
        <Plus className="mr-2 h-5 w-5" />
        Add Course
      </Button>

      {materials.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
            <BookOpen className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            No courses yet
          </h3>
          <p className="text-muted-foreground">
            Add your first course to get started
          </p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {transformedMaterials.map((material, index) => (
              <MaterialCard
                key={material.id}
                material={material}
                index={index}
                onUpdateIcon={(icon) => updateMaterialIcon(material.id, icon)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddMaterialDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={addMaterial}
      />
    </motion.div>
  );
}
