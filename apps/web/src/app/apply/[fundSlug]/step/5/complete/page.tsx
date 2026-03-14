"use client";

import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";
import Link from "next/link";

export default function Step5CompletePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const fundSlug = params.fundSlug as string;
  const event = searchParams.get("event") ?? "";
  const { getAccessToken } = usePrivy();
  const { stepData, updateStep } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const [processing, setProcessing] = useState(true);
  const [error, setError] = useState<string>("");

  const completeSigning = useCallback(async () => {
    if (!investorId) return;
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/docusign/complete-step5", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ investorId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to complete");
      }
      updateStep("step5", { completed: true });
      router.push(`/apply/${fundSlug}/step/6`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setProcessing(false);
    }
  }, [investorId, fundSlug, getAccessToken, updateStep, router]);

  useEffect(() => {
    if (!investorId) {
      setProcessing(false);
      return;
    }
    if (event === "signing_complete") {
      completeSigning();
    } else {
      setProcessing(false);
    }
  }, [event, investorId, completeSigning]);

  if (!investorId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Session expired. Please start from Step 1.</p>
        <Link
          href={`/apply/${fundSlug}/step/1`}
          className="mt-4 inline-block text-slate-600 underline hover:text-slate-900"
        >
          Start over
        </Link>
      </div>
    );
  }

  if (event === "signing_complete" && processing) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <p className="mt-4 text-sm text-slate-600">Processing your signature...</p>
      </div>
    );
  }

  if (event === "signing_complete" && error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-red-600">{error}</p>
        <Link
          href={`/apply/${fundSlug}/step/6`}
          className="mt-4 inline-block text-slate-900 underline hover:no-underline"
        >
          Continue to next step
        </Link>
      </div>
    );
  }

  if (event === "cancel" || event === "session_timeout") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Resume Later</h1>
        <p className="mt-2 text-slate-600">
          You can return anytime to complete your subscription agreement. Your progress is saved.
        </p>
        <Link
          href={`/apply/${fundSlug}/step/5`}
          className="mt-6 inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Resume signing
        </Link>
      </div>
    );
  }

  if (event === "decline") {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Signing Declined</h1>
        <p className="mt-2 text-slate-600">
          You chose not to sign the subscription agreement. If you have questions or need
          assistance, please contact the fund manager.
        </p>
        <Link
          href={`/apply/${fundSlug}/step/5`}
          className="mt-6 inline-block text-slate-900 underline hover:no-underline"
        >
          Try again
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
      <p className="text-slate-600">Redirecting...</p>
      <Link
        href={`/apply/${fundSlug}/step/5`}
        className="mt-4 inline-block text-slate-600 underline hover:text-slate-900"
      >
        Back to signing
      </Link>
    </div>
  );
}
