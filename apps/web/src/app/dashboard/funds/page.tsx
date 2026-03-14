// apps/web/src/app/dashboard/funds/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { PiggyBank } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { FundsTableSkeleton } from "@/components/dashboard/FundsTableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function FundsPage() {
  const { getAccessToken } = usePrivy();
  const { data: funds, isLoading } = useQuery({
    queryKey: ["funds"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/funds", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) return <FundsTableSkeleton />;

  const list = Array.isArray(funds) ? funds : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Funds</h1>
        <Link
          href="/dashboard/funds/new"
          className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
        >
          Create Fund
        </Link>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={PiggyBank}
          title="No funds yet"
          description="Create your first fund to start inviting investors."
          action={
            <Link
              href="/dashboard/funds/new"
              className="inline-flex rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
            >
              Create your first fund
            </Link>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full divide-y divide-slate-200">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Target
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  Min
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-500">
                  #
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {list.map((f: { id: string; name: string; status: string; target_raise_cents: number; min_investment_cents: number; _investorCount?: number }) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                  <td>
                    <span
                      className={cn(
                        "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                        f.status === "active" && "bg-emerald-100 text-emerald-800",
                        f.status === "draft" && "bg-slate-100 text-slate-700",
                        f.status === "closed" && "bg-amber-100 text-amber-800"
                      )}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatCurrency(f.target_raise_cents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {formatCurrency(f.min_investment_cents)}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">
                    {f._investorCount ?? 0}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/funds/${f.id}`}
                      className="text-sm font-medium text-[#1D4ED8] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
