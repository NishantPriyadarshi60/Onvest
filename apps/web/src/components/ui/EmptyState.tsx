"use client";

import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 p-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="h-8 w-8" strokeWidth={1.5} />
      </div>
      <p className="mt-4 text-lg font-medium text-slate-700">{title}</p>
      {description && <p className="mt-2 text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
