import { Skeleton } from '@/components/ui/skeleton';

export function VocabularySkeleton() {
  return (
    <div className="pb-20">
      <div className="mb-8">
        <Skeleton className="h-9 w-36 mb-2" />
        <Skeleton className="h-5 w-20" />
      </div>

      {/* Search */}
      <Skeleton className="mb-6 h-14 w-full rounded-2xl" />

      {/* Buttons */}
      <div className="flex gap-3 mb-6">
        <Skeleton className="flex-1 h-14 rounded-2xl" />
        <Skeleton className="h-14 w-32 rounded-2xl" />
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex justify-between items-start mb-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
