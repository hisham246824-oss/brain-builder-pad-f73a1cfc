import { Skeleton } from '@/components/ui/skeleton';

export function SupportSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-44 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-36 rounded-[2rem]" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 rounded-[2rem]" />
        ))}
      </div>

      {/* Ticket list */}
      {[1, 2, 3].map(i => (
        <div key={i} className="rounded-[2rem] border border-border/30 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
