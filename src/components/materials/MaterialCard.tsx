import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';
import { Material } from '@/types/study';

interface MaterialCardProps {
  material: Material;
  index: number;
}

export function MaterialCard({ material, index }: MaterialCardProps) {
  const completedCount = material.lessons.filter((l) => l.completed).length;
  const totalCount = material.lessons.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Link to={`/materials/${material.id}`}>
        <div className="group relative overflow-hidden rounded-3xl bg-card p-6 shadow-card transition-all hover:shadow-soft hover:-translate-y-1">
          {/* Color accent bar */}
          <div
            className="absolute left-0 top-0 h-full w-1.5 rounded-l-3xl"
            style={{ backgroundColor: material.color }}
          />
          
          <div className="flex items-start justify-between">
            <div className="flex-1 pl-3">
              <div className="flex items-center gap-2">
                <BookOpen
                  className="h-5 w-5"
                  style={{ color: material.color }}
                />
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
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: material.color }}
                  />
                </div>
              </div>

              {/* Lesson indicators */}
              {totalCount > 0 && totalCount <= 8 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {material.lessons.map((lesson) => (
                    <div key={lesson.id} title={lesson.title}>
                      {lesson.completed ? (
                        <CheckCircle2
                          className="h-4 w-4 text-success"
                        />
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
            className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-10 transition-all group-hover:scale-150 group-hover:opacity-20"
            style={{ backgroundColor: material.color }}
          />
        </div>
      </Link>
    </motion.div>
  );
}
