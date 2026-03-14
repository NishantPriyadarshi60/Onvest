// apps/web/src/components/dashboard/StatsCard.tsx
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  label: string;
  value: number | string;
  change?: number;
  icon?: React.ReactNode;
  color?: "blue" | "green" | "amber" | "slate";
}

const colorMap = {
  blue: "border-l-[#1D4ED8] bg-blue-50/50",
  green: "border-l-emerald-500 bg-emerald-50/50",
  amber: "border-l-amber-500 bg-amber-50/50",
  slate: "border-l-slate-400 bg-slate-50/50",
};

export function StatsCard({ label, value, change, icon, color = "blue" }: StatsCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-200 border-l-4 bg-white p-4 shadow-sm",
        colorMap[color]
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {change !== undefined && (
            <p
              className={cn(
                "mt-1 text-sm",
                change >= 0 ? "text-emerald-600" : "text-red-600"
              )}
            >
              {change >= 0 ? "+" : ""}{change}% vs last period
            </p>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}
