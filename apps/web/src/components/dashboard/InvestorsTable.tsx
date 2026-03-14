"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, truncateAddress } from "@/lib/utils";

const ACCR_LABELS: Record<string, string> = {
  income: "Income",
  net_worth: "Net Worth",
  professional: "Professional",
  entity: "Entity",
};

function KycBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    not_started: "bg-slate-100 text-slate-700",
    pending: "bg-amber-100 text-amber-800",
    approved: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
    expired: "bg-slate-100 text-slate-600",
  };
  const label =
    status === "not_started" ? "Not started" : status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

export interface InvestorWithFund {
  id: string;
  full_name: string | null;
  email: string;
  status: string;
  kyc_status: string;
  accreditation_type: string | null;
  subscription_amount_cents: number | null;
  wallet_address: string | null;
  created_at: string;
  fund_name?: string;
}

const PAGE_SIZE = 25;

export function InvestorsTable({ investors }: { investors: InvestorWithFund[] }) {
  const [search, setSearch] = useState("");
  const [kycFilter, setKycFilter] = useState<string>("");
  const [accredFilter, setAccredFilter] = useState<string>("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = investors;
    const q = search.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (i) =>
          (i.full_name?.toLowerCase().includes(q) ?? false) ||
          i.email.toLowerCase().includes(q)
      );
    }
    if (kycFilter) {
      list = list.filter((i) => i.kyc_status === kycFilter);
    }
    if (accredFilter) {
      list = list.filter((i) => (i.accreditation_type ?? "") === accredFilter);
    }
    return list;
  }, [investors, search, kycFilter, accredFilter]);

  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;

  const exportCsv = () => {
    const headers = ["Name", "Email", "Fund", "KYC Status", "Accreditation", "Amount", "Wallet", "Joined"];
    const rows = filtered.map((i) => [
      i.full_name ?? "",
      i.email,
      i.fund_name ?? "",
      i.kyc_status,
      i.accreditation_type ? ACCR_LABELS[i.accreditation_type] ?? i.accreditation_type : "",
      i.subscription_amount_cents != null ? (i.subscription_amount_cents / 100).toFixed(2) : "",
      i.wallet_address ?? "",
      new Date(i.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `investors-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const kycStatuses = useMemo(() => {
    const set = new Set(investors.map((i) => i.kyc_status || "not_started"));
    return Array.from(set).filter(Boolean);
  }, [investors]);

  const accredTypes = useMemo(() => {
    const set = new Set(investors.map((i) => i.accreditation_type).filter(Boolean));
    return Array.from(set) as string[];
  }, [investors]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Search name or email"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="max-w-xs"
        />
        <select
          value={kycFilter}
          onChange={(e) => {
            setKycFilter(e.target.value);
            setPage(0);
          }}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        >
          <option value="">All KYC status</option>
          {kycStatuses.map((s) => (
            <option key={s} value={s}>
              {s === "not_started" ? "Not started" : s}
            </option>
          ))}
        </select>
        <select
          value={accredFilter}
          onChange={(e) => {
            setAccredFilter(e.target.value);
            setPage(0);
          }}
          className="h-10 rounded-md border border-slate-200 px-3 text-sm"
        >
          <option value="">All accreditation</option>
          {accredTypes.map((t) => (
            <option key={t} value={t ?? ""}>
              {t ? ACCR_LABELS[t] ?? t : "—"}
            </option>
          ))}
        </select>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={exportCsv}>
          Export CSV
        </Button>
        <Link href="/dashboard/investors/kyc-queue">
          <Button size="sm">KYC Queue</Button>
        </Link>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>KYC Status</TableHead>
              <TableHead>Accreditation</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Wallet</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                  No investors found
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.full_name ?? "—"}</TableCell>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell>{inv.fund_name ?? "—"}</TableCell>
                  <TableCell>
                    <KycBadge status={inv.kyc_status || "not_started"} />
                  </TableCell>
                  <TableCell>
                    {inv.accreditation_type
                      ? ACCR_LABELS[inv.accreditation_type] ?? inv.accreditation_type
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {inv.subscription_amount_cents != null
                      ? formatCurrency(inv.subscription_amount_cents)
                      : "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {inv.wallet_address ? truncateAddress(inv.wallet_address) : "—"}
                  </TableCell>
                  <TableCell className="text-slate-600">
                    {new Date(inv.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
