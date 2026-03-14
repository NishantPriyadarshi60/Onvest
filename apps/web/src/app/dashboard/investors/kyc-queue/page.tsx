"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { InvestorTableSkeleton } from "@/components/dashboard/InvestorTableSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface KycQueueInvestor {
  id: string;
  full_name: string | null;
  email: string;
  kyc_completed_at: string | null;
  kyc_result: Record<string, unknown>;
  fund_name?: string;
}

const REJECT_REASONS = [
  "Incomplete documentation",
  "Does not meet accreditation requirements",
  "Other (see notes)",
];

export default function KycQueuePage() {
  const { getAccessToken } = usePrivy();
  const queryClient = useQueryClient();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<{ investor: KycQueueInvestor } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");

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

  const approveMutation = useMutation({
    mutationFn: async (investorId: string) => {
      const token = await getAccessToken();
      const res = await fetch(`/api/investors/${investorId}/approve`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to approve");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      setExpandedId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ investorId, reason }: { investorId: string; reason: string }) => {
      const token = await getAccessToken();
      const res = await fetch(`/api/investors/${investorId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "Failed to reject");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      setRejectModal(null);
      setRejectReason("");
      setRejectNotes("");
    },
  });

  const queue = investors
    .filter(
      (i: { kyc_status: string; status: string }) =>
        i.kyc_status === "approved" &&
        (i.status === "kyc_pending" || i.status === "accreditation_pending")
    )
    .sort((a: KycQueueInvestor, b: KycQueueInvestor) => {
      const at = a.kyc_completed_at ? new Date(a.kyc_completed_at).getTime() : 0;
      const bt = b.kyc_completed_at ? new Date(b.kyc_completed_at).getTime() : 0;
      return at - bt;
    }) as KycQueueInvestor[];

  const getKycSummary = (result: Record<string, unknown>) => {
    const attrs = (result?.data as { attributes?: Record<string, unknown> })?.attributes ?? result;
    const fields = (attrs?.fields as Record<string, unknown>) ?? {};
    const name = (fields["name-first"] ?? "") + " " + (fields["name-last"] ?? "");
    const dob = (fields["birthdate"] as string) ?? attrs?.["date-of-birth"] ?? "—";
    const nationality = (fields["nationality"] as string) ?? attrs?.["country-of-residence"] ?? "—";
    return { name: name.trim() || "—", dob, nationality };
  };

  if (isLoading) return <InvestorTableSkeleton />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <Link href="/dashboard/investors" className="text-sm text-slate-500 hover:text-slate-700">
            ← Back to Investors
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900">KYC Review Queue</h1>
          <p className="mt-1 text-slate-500">
            Investors who completed KYC and await your review
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>KYC completed</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={CheckCircle2}
                    title="All caught up!"
                    description="No investors awaiting review. New KYC completions will appear here."
                  />
                </TableCell>
              </TableRow>
            ) : (
              queue.map((inv) => (
                <React.Fragment key={inv.id}>
                  <TableRow
                    key={inv.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedId(expandedId === inv.id ? null : inv.id)}
                  >
                    <TableCell className="w-8">
                      {expandedId === inv.id ? "▼" : "▶"}
                    </TableCell>
                    <TableCell className="font-medium">
                      {inv.full_name ?? "—"}
                    </TableCell>
                    <TableCell>{inv.email}</TableCell>
                    <TableCell>{inv.fund_name ?? "—"}</TableCell>
                    <TableCell>
                      {inv.kyc_completed_at
                        ? new Date(inv.kyc_completed_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          loading={approveMutation.isPending}
                          disabled={approveMutation.isPending}
                          onClick={() => approveMutation.mutate(inv.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          loading={rejectMutation.isPending}
                          disabled={rejectMutation.isPending}
                          onClick={() => setRejectModal({ investor: inv })}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedId === inv.id && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-slate-50 py-4">
                        <div className="rounded-md border border-slate-200 bg-white p-4">
                          <p className="text-sm font-medium text-slate-700">KYC Summary</p>
                          {(() => {
                            const s = getKycSummary(inv.kyc_result);
                            return (
                              <dl className="mt-2 grid gap-1 text-sm text-slate-600 sm:grid-cols-3">
                                <div><dt className="font-medium">Name</dt><dd>{s.name}</dd></div>
                                <div><dt className="font-medium">DOB</dt><dd>{s.dob}</dd></div>
                                <div><dt className="font-medium">Nationality</dt><dd>{s.nationality}</dd></div>
                              </dl>
                            );
                          })()}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!rejectModal} onOpenChange={(open) => !open && setRejectModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject application</DialogTitle>
          </DialogHeader>
          {rejectModal && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Rejecting {rejectModal.investor.full_name ?? rejectModal.investor.email} will send
                them an email with the reason.
              </p>
              <div>
                <label className="mb-1 block text-sm font-medium">Reason</label>
                <select
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="h-10 w-full rounded-md border border-slate-200 px-3"
                >
                  <option value="">Select…</option>
                  {REJECT_REASONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                  placeholder="Additional context for the rejection"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModal(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={rejectMutation.isPending}
              disabled={!rejectReason || rejectMutation.isPending}
              onClick={() => {
                if (!rejectModal || !rejectReason) return;
                const reason = rejectNotes ? `${rejectReason}: ${rejectNotes}` : rejectReason;
                rejectMutation.mutate({ investorId: rejectModal.investor.id, reason });
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
