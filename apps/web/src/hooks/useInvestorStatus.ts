"use client";

import { useEffect, useState, useCallback } from "react";

export interface InvestorStatus {
  id: string;
  status: string;
  kyc_status: string;
  doc_signed_at: string | null;
  fund_name?: string | null;
  fund_slug?: string | null;
  rejection_reason?: string | null;
}

/**
 * Fetches and optionally subscribes to investor status.
 * Uses polling every 3s when status is "under review" (realtime requires Supabase Auth).
 */
export function useInvestorStatus(investorId: string | null): InvestorStatus | null {
  const [status, setStatus] = useState<InvestorStatus | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!investorId) return;
    try {
      const res = await fetch(`/api/investors/${investorId}`);
      if (res.ok) {
        const data = await res.json();
        setStatus({
          id: data.id,
          status: data.status,
          kyc_status: data.kyc_status ?? "not_started",
          doc_signed_at: data.doc_signed_at ?? null,
          fund_name: data.fund_name,
          fund_slug: data.fund_slug,
          rejection_reason: data.rejection_reason,
        });
      }
    } catch {
      // ignore
    }
  }, [investorId]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!investorId || !status) return;
    const underReview =
      status.status === "kyc_pending" || status.status === "accreditation_pending";
    if (!underReview) return;
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [investorId, status?.status, fetchStatus]);

  return status;
}
