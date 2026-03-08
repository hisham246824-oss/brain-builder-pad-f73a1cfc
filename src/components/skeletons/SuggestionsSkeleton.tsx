import { Skeleton } from '@/components/ui/skeleton';

export function SuggestionsSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <div>
            <Skeleton className="h-8 w-36 mb-1" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-40 rounded-2xl" />
      </div>

      {/* Filter */}
      <Skeleton className="h-14 rounded-3xl" />

      {/* Suggestion cards */}
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="rounded-3xl border border-border/50 p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-12 w-16 rounded-2xl shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}
