"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InvestorStatusListPage() {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { data: investors = [], isLoading } = useQuery({
    queryKey: ["investors-me"],
    queryFn: async () => {
      const token = await getAccessToken();
      const res = await fetch("/api/investors/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  useEffect(() => {
    if (!isLoading && investors.length === 1) {
      router.replace(`/investor/${investors[0].id}/status`);
    }
  }, [isLoading, investors, router]);

  if (isLoading) return <p className="p-6 text-slate-500">Loading…</p>;

  if (investors.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Application Status</h1>
        <p className="mt-2 text-slate-600">You don&apos;t have any applications yet.</p>
      </div>
    );
  }

  if (investors.length === 1) {
    return (
      <div className="p-6">
        <p className="text-slate-600">Redirecting to your application status…</p>
        <Link href={`/investor/${investors[0].id}/status`} className="text-blue-600 hover:underline">
          Click here if not redirected
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Your Applications</h1>
      <p className="mt-2 text-slate-600">Select an application to view its status</p>
      <ul className="mt-6 space-y-2">
        {investors.map((inv: { id: string; fund_name?: string; status: string }) => (
          <li key={inv.id}>
            <Link
              href={`/investor/${inv.id}/status`}
              className="block rounded-lg border border-slate-200 p-4 hover:bg-slate-50"
            >
              <span className="font-medium">{inv.fund_name ?? "Fund"}</span>
              <span className="ml-2 text-slate-500">— {inv.status}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
