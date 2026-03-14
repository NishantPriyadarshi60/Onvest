// apps/web/src/app/dashboard/investors/page.tsx
"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { UserPlus } from "lucide-react";
import { InvestorsTable } from "@/components/dashboard/InvestorsTable";
import { InvestorTableSkeleton } from "@/components/dashboard/InvestorTableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export default function InvestorsPage() {
  const { getAccessToken } = usePrivy();
  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["investors"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/investors", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Investors</h1>
        <p className="mt-2 text-slate-500">Investors across your funds</p>
        <div className="mt-6">
          <InvestorTableSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-slate-900">Investors</h1>
      <p className="mt-2 text-slate-500">Investors across your funds</p>
      <div className="mt-6">
        {investors.length === 0 ? (
          <EmptyState
            icon={UserPlus}
            title="No investors yet"
            description="Invite investors to your funds to get started."
            action={
              <Link
                href="/dashboard/funds"
                className="inline-flex rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
              >
                Invite your first investor
              </Link>
            }
          />
        ) : (
          <InvestorsTable investors={investors} />
        )}
      </div>
    </div>
  );
}
