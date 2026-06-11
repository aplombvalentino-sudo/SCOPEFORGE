/* Route-level skeleton for the scope builder. */

import { Skeleton, SkeletonRows } from "@/components/ui/feedback";

export default function ScopeBuilderLoading() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-6 w-80 max-w-full" />
          <Skeleton className="h-3.5 w-[28rem] max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8.5 w-20" />
          <Skeleton className="h-8.5 w-24" />
          <Skeleton className="h-8.5 w-36" />
        </div>
      </div>
      <Skeleton className="mb-5 h-8 w-96 max-w-full" />
      <div className="panel">
        <SkeletonRows rows={6} />
      </div>
    </div>
  );
}
