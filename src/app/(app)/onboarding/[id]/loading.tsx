/* Route-level skeleton for the onboarding flow detail. */

import { Skeleton, SkeletonRows } from "@/components/ui/feedback";

export default function OnboardingFlowLoading() {
  return (
    <div>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-6 w-72 max-w-full" />
          <Skeleton className="h-3.5 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8.5 w-44" />
          <Skeleton className="h-8.5 w-28" />
        </div>
      </div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <Skeleton className="h-28 flex-1 rounded-lg" />
        <Skeleton className="h-28 w-72 max-w-full rounded-lg" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="panel">
            <SkeletonRows rows={4} />
          </div>
          <div className="panel">
            <SkeletonRows rows={4} />
          </div>
        </div>
        <div className="panel">
          <SkeletonRows rows={5} />
        </div>
      </div>
    </div>
  );
}
