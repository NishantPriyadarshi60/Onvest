"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useInvestorStatus } from "@/hooks/useInvestorStatus";

const STAGES = [
  { id: "applied", label: "Applied", statuses: ["invited", "applying", "kyc_pending"] },
  { id: "kyc", label: "KYC Review", statuses: ["accreditation_pending"] },
  { id: "docs", label: "Documents", statuses: ["docs_pending"] },
  { id: "approved", label: "Approved", statuses: ["approved"] },
  { id: "whitelisted", label: "Whitelisted", statuses: ["whitelisted"] },
  { id: "funded", label: "Funded", statuses: ["funded"] },
];

function getCurrentStageIndex(status: string): number {
  for (let i = 0; i < STAGES.length; i++) {
    if (STAGES[i].statuses.includes(status)) return i;
  }
  if (status === "kyc_failed" || status === "rejected") return -1;
  return 0;
}

export default function InvestorStatusPage() {
  const params = useParams();
  const investorId = params.investorId as string;
  const investor = useInvestorStatus(investorId);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!investorId || !investor?.doc_signed_at) return;
    const load = async () => {
      try {
        const res = await fetch(
          `/api/documents/signed-subscription?investorId=${investorId}`,
          { credentials: "include" }
        );
        if (res.ok) {
          const { url } = await res.json();
          setDownloadUrl(url);
        }
      } catch {
        // ignore
      }
    };
    void load();
  }, [investorId, investor?.doc_signed_at]);

  if (!investor && investorId) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Loading status…</p>
      </div>
    );
  }

  if (!investor) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-slate-900">Application Status</h1>
        <p className="mt-2 text-slate-600">Invalid or missing application.</p>
      </div>
    );
  }

  const currentIndex = getCurrentStageIndex(investor.status);
  const isReviewing =
    investor.status === "kyc_pending" || investor.status === "accreditation_pending";

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold text-slate-900">Application Status</h1>
      <p className="mt-2 text-slate-600">
        {investor.fund_name ? `Your application to ${investor.fund_name}` : "Your application"}
      </p>

      {isReviewing && (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <span
            className="h-3 w-3 animate-pulse rounded-full bg-amber-500"
            title="Live status"
          />
          <p className="text-amber-800">Your application is being reviewed…</p>
        </div>
      )}

      <div className="mt-6">
        <h2 className="text-sm font-medium text-slate-700">Progress</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {STAGES.map((stage, i) => {
            const isComplete = currentIndex > i;
            const isCurrent = currentIndex === i;
            return (
              <div
                key={stage.id}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                  isCurrent
                    ? "border-slate-900 bg-slate-50 shadow-sm"
                    : isComplete
                      ? "border-emerald-200 bg-emerald-50"
                      : "border-slate-200 bg-white"
                }`}
              >
                {isCurrent && (
                  <span
                    className="h-2 w-2 animate-pulse rounded-full bg-slate-900"
                    title="Current step"
                  />
                )}
                {isComplete && (
                  <span className="text-emerald-600">✓</span>
                )}
                <span
                  className={`text-sm font-medium ${
                    isCurrent ? "text-slate-900" : isComplete ? "text-emerald-800" : "text-slate-500"
                  }`}
                >
                  {stage.label}
                </span>
                {i < STAGES.length - 1 && (
                  <span className="text-slate-300">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {downloadUrl && investor.doc_signed_at && (
        <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-sm font-medium text-slate-700">Documents</h2>
          <a
            href={downloadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm text-slate-600 underline hover:text-slate-900"
          >
            Download signed subscription agreement
          </a>
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-slate-500">Status</dt>
            <dd className="mt-1 font-medium text-slate-900 capitalize">
              {investor.status.replace(/_/g, " ")}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-slate-500">KYC</dt>
            <dd className="mt-1 text-slate-900">
              {investor.kyc_status === "approved" ? "Verified" : investor.kyc_status}
            </dd>
          </div>
        </dl>

        {investor.status === "rejected" && investor.rejection_reason && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-800">Rejection reason</p>
            <p className="mt-1 text-sm text-red-700">{investor.rejection_reason}</p>
          </div>
        )}

        {investor.status === "approved" && (
          <p className="mt-4 text-sm text-green-700">
            Your application has been approved. Next steps will be shared by the fund manager.
          </p>
        )}

        {investor.status === "whitelisted" && (
          <p className="mt-4 text-sm text-green-700">
            Your wallet has been whitelisted. You can now receive tokens.
          </p>
        )}
      </div>
    </div>
  );
}
