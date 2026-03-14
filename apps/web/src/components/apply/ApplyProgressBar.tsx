"use client";

import { usePathname } from "next/navigation";

const STEPS = 7;

export function ApplyProgressBar() {
  const pathname = usePathname();
  const match = pathname.match(/\/apply\/[^/]+\/step\/(\d+)/);
  const currentStep = match ? parseInt(match[1], 10) : 0;

  return (
    <div className="w-full px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-center gap-1">
        {Array.from({ length: STEPS }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              step <= currentStep ? "bg-slate-900" : "bg-slate-200"
            }`}
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
