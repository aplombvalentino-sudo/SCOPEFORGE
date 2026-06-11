/* Skeleton for the lead workspace while the route segment loads. */

import { Skeleton } from "@/components/ui/feedback";

export default function LeadWorkspaceLoading() {
  return (
    <div role="status" aria-label="Loading lead workspace">
      {/* header */}
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="mt-2.5 h-7 w-60" />
          <Skeleton className="mt-2 h-3.5 w-44" />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end gap-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>

      {/* meta chips */}
      <div className="mb-4 flex items-center gap-2">
        <Skeleton className="h-4.5 w-20" />
        <Skeleton className="h-4.5 w-24" />
        <Skeleton className="h-3.5 w-56" />
      </div>

      {/* stage stepper */}
      <Skeleton className="mb-5 h-12 w-full rounded-lg" />

      {/* tabs */}
      <div className="mb-5 flex items-center gap-5 border-b border-line pb-3">
        <Skeleton className="h-3.5 w-16" />
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3.5 w-16" />
      </div>

      {/* two-column body */}
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1 space-y-5">
          <div className="panel space-y-2.5 px-4 py-4">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
          </div>
          <div className="panel space-y-2.5 px-4 py-4">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
            <Skeleton className="h-28 rounded-lg" />
          </div>
        </div>
        <div className="hidden w-[300px] shrink-0 space-y-4 xl:block">
          <Skeleton className="h-36 rounded-lg" />
          <Skeleton className="h-32 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
