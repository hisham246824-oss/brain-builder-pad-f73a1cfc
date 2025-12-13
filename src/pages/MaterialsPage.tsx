import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { AddMaterialDialog } from '@/components/materials/AddMaterialDialog';
import { useStudyData } from '@/contexts/StudyDataContext';

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { materials, isLoading, addMaterial, updateMaterialIcon } = useStudyData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

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
            {materials.map((material, index) => (
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
