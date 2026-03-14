// apps/web/src/app/dashboard/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { StatsCard } from "@/components/dashboard/StatsCard";

export default function DashboardPage() {
  const { getAccessToken } = usePrivy();
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/dashboard/stats", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  const { funds, activity, investorCounts } = data;
  const totalInvestors = investorCounts?.total ?? 0;
  const approvedCount = investorCounts?.approved ?? 0;
  const invitedCount = investorCounts?.invited ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Funds" value={funds?.length ?? 0} color="blue" />
        <StatsCard label="Total Investors" value={totalInvestors} color="green" />
        <StatsCard label="Approved" value={approvedCount} color="green" />
        <StatsCard label="Invited" value={invitedCount} color="amber" />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-900">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/funds/new"
            className="inline-flex items-center rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
          >
            Create Fund
          </Link>
          <Link
            href="/dashboard/funds"
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Funds
          </Link>
          <Link
            href="/dashboard/investors"
            className="inline-flex items-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View Investors
          </Link>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-medium text-slate-900">Recent activity</h2>
        {!activity?.length ? (
          <p className="text-sm text-slate-500">No recent activity</p>
        ) : (
          <ul className="space-y-2">
            {activity.map((a: { id: string; action: string; created_at: string }) => (
              <li key={a.id} className="flex items-center gap-3 text-sm">
                <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs">
                  {a.action}
                </span>
                <span className="text-slate-500">
                  {new Date(a.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
