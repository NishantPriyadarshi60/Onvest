"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function FundCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <Skeleton className="mb-3 h-6 w-3/4" />
      <Skeleton className="mb-2 h-4 w-16 rounded-full" />
      <Skeleton className="mb-4 h-4 w-24" />
      <Skeleton className="h-4 w-20" />
      <div className="mt-4 flex justify-end">
        <Skeleton className="h-9 w-16 rounded" />
      </div>
    </div>
  );
}
