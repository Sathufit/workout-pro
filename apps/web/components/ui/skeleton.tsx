import { cn } from '../../lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-slate-100', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-2">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-8 w-1/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}
