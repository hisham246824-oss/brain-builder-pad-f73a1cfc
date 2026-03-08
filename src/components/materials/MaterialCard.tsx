import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { CheckCircle2, Circle } from 'lucide-react';
import { Material } from '@/types/study';
import { IconSelector, getMaterialIcon } from './IconSelector';

interface MaterialCardProps {
  material: Material;
  index: number;
  onUpdateIcon?: (icon: Material['icon']) => void;
}

export function MaterialCard({ material, index, onUpdateIcon }: MaterialCardProps) {
  const [showIconSelector, setShowIconSelector] = useState(false);
  const completedCount = material.lessons.filter((l) => l.completed).length;
  const totalCount = material.lessons.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const MaterialIcon = getMaterialIcon(material.icon || 'book');

  const handleIconClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowIconSelector(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: Math.min(index * 0.04, 0.3) }}
        className="gpu"
      >
        <Link to={`/materials/${material.id}`}>
          <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-card transition-shadow duration-150 hover:shadow-soft contain-paint active:scale-[0.99]">
            {/* Color accent bar */}
            <div
              className="absolute left-0 top-0 h-full w-1.5 rounded-l-3xl"
              style={{ backgroundColor: material.color }}
            />
            
            <div className="flex items-start justify-between">
              <div className="flex-1 pl-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleIconClick}
                    className="p-1 rounded-lg transition-colors duration-150 hover:bg-secondary active:scale-[0.95]"
                    title="Click to change icon"
                  >
                    <MaterialIcon
                      className="h-5 w-5"
                      style={{ color: material.color }}
                    />
                  </button>
                  <h3 className="font-semibold text-card-foreground">
                    {material.title}
                  </h3>
                </div>
                
                {material.description && (
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {material.description}
                  </p>
                )}

                {/* Progress section */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-card-foreground">
                      {completedCount}/{totalCount} lessons
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-[width] duration-300 ease-out"
                      style={{ backgroundColor: material.color, width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Lesson indicators */}
                {totalCount > 0 && totalCount <= 8 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {material.lessons.map((lesson) => (
                      <div key={lesson.id} title={lesson.title}>
                        {lesson.completed ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground/40" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Hover effect */}
            <div
              className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 transition-opacity duration-150 group-hover:opacity-20"
              style={{ backgroundColor: material.color }}
            />
          </div>
        </Link>
      </motion.div>

      <IconSelector
        isOpen={showIconSelector}
        onClose={() => setShowIconSelector(false)}
        currentIcon={material.icon || 'book'}
        onSelect={(icon) => {
          onUpdateIcon?.(icon);
          setShowIconSelector(false);
        }}
        color={material.color}
      />
    </>
  );
}
