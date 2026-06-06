interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-rito-deep/40 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-rito-elevated border border-rito-deep/40 rounded-xl p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}

export function SkeletonStepper() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
