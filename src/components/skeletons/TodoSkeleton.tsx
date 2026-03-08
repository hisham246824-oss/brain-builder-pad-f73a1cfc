import { Skeleton } from '@/components/ui/skeleton';

export function TodoSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-36 mb-1" />
            <Skeleton className="h-4 w-52" />
          </div>
        </div>
        <Skeleton className="h-11 w-32 rounded-2xl" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>

      {/* Progress */}
      <Skeleton className="h-16 rounded-2xl" />

      {/* Filter pills */}
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-[1.25rem] border-2 border-border/30 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-6 w-6 rounded-lg mt-1" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-32 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
