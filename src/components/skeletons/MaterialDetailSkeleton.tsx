import { Skeleton } from '@/components/ui/skeleton';

export function MaterialDetailSkeleton() {
  return (
    <div>
      {/* Back button */}
      <Skeleton className="h-5 w-32 mb-6" />

      {/* Header Card */}
      <div className="relative mb-8 overflow-hidden rounded-3xl bg-card p-6 shadow-soft">
        <Skeleton className="absolute left-0 top-0 h-full w-2" />
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4 pl-4">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>

        {/* Progress */}
        <div className="mt-6 pl-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="mt-2 h-3 w-full rounded-full" />
        </div>
      </div>

      {/* Tab Buttons */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="flex-1 h-12 rounded-xl" />
      </div>

      {/* Lessons */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-full max-w-xs" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
