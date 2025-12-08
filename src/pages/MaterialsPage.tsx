import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MaterialCard } from '@/components/materials/MaterialCard';
import { AddMaterialDialog } from '@/components/materials/AddMaterialDialog';
import { useStudyData } from '@/hooks/useStudyData';

export default function MaterialsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { materials, isLoading, addMaterial } = useStudyData();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">
            Study Materials
          </h1>
          <p className="mt-1 text-muted-foreground">
            {materials.length} {materials.length === 1 ? 'subject' : 'subjects'}
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="rounded-2xl"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </motion.div>

      {/* Materials Grid */}
      {materials.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((material, index) => (
            <MaterialCard key={material.id} material={material} index={index} />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center rounded-3xl bg-card py-16 px-8 text-center shadow-card"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <BookOpen className="h-8 w-8" />
          </div>
          <h2 className="mb-2 text-xl font-semibold text-card-foreground">
            No materials yet
          </h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Start by adding your first study material. Click the button above to get started.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="rounded-2xl"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Material
          </Button>
        </motion.div>
      )}

      <AddMaterialDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAdd={addMaterial}
      />
    </div>
  );
}
