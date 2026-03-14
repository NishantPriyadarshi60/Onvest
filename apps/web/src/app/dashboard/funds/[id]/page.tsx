// apps/web/src/app/dashboard/funds/[id]/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { formatCurrency } from "@/lib/utils";
import { InviteInvestorModal } from "@/components/dashboard/InviteInvestorModal";
import { Button } from "@/components/ui/button";

export default function FundDetailPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const params = useParams();
  const id = params.id as string;
  const { getAccessToken } = usePrivy();
  const { data: fund, isLoading } = useQuery({
    queryKey: ["fund", id],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch(`/api/funds/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!id,
  });

  if (isLoading) return <p className="text-slate-500">Loading…</p>;
  if (!fund) return <p className="text-slate-500">Fund not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/funds" className="text-slate-500 hover:text-slate-700">
          ← Funds
        </Link>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-slate-900">{fund.name}</h1>
        <Button onClick={() => setInviteOpen(true)}>Invite investor</Button>
      </div>
      <InviteInvestorModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        fundId={fund.id}
        fundName={fund.name}
      />
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">Status</dt>
            <dd className="font-medium">{fund.status}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Slug</dt>
            <dd className="font-mono text-sm">{fund.slug}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Target raise</dt>
            <dd>{formatCurrency(fund.target_raise_cents)}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">Min investment</dt>
            <dd>{formatCurrency(fund.min_investment_cents)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
