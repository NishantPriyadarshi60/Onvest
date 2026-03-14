"use client";

import { useParams } from "next/navigation";
import { useApplicationState } from "@/hooks/useApplicationState";
import Link from "next/link";

export default function ApplySuccessPage() {
  const params = useParams();
  const fundSlug = params.fundSlug as string;
  const { stepData, clearApplication } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const handleViewStatus = () => {
    clearApplication();
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h1 className="mt-4 text-xl font-semibold text-slate-900">Application Submitted!</h1>
      <p className="mt-2 text-slate-600">
        Thank you. Your application has been received and is under review.
      </p>

      {investorId && (
        <Link
          href={`/investor/${investorId}/status`}
          onClick={handleViewStatus}
          className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          View application status
        </Link>
      )}

      <div className="mt-8 rounded-lg border border-slate-200 bg-slate-50 p-6 text-left">
        <h2 className="text-sm font-medium text-slate-900">What happens next?</h2>
        <ol className="mt-3 space-y-2 text-sm text-slate-600">
          <li className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
              1
            </span>
            <span>GP reviews your application and KYC</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
              2
            </span>
            <span>You receive an email when approved or if more info is needed</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium text-slate-700">
              3
            </span>
            <span>After approval, your wallet is whitelisted for funding</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
