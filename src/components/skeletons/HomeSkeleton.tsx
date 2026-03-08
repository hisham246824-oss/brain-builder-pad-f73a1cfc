import { Skeleton } from '@/components/ui/skeleton';

export function HomeSkeleton() {
  return (
    <div className="flex flex-col items-center pb-12">
      <div className="text-center py-12 md:py-20 max-w-2xl mx-auto w-full">
        <Skeleton className="h-16 w-16 rounded-2xl mx-auto mb-6" />
        <Skeleton className="h-12 w-80 mx-auto mb-4" />
        <Skeleton className="h-6 w-96 mx-auto mb-8 max-w-full" />
        <Skeleton className="h-14 w-48 mx-auto rounded-full" />
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4 w-full max-w-3xl mb-12">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-40 w-full max-w-xl rounded-3xl" />
    </div>
  );
}
