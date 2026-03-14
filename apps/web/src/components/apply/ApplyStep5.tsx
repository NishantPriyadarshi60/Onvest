"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";

interface ApplyStep5Props {
  fundSlug: string;
}

export function ApplyStep5({ fundSlug }: ApplyStep5Props) {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { stepData } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const [signingUrl, setSigningUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchSession = useCallback(async () => {
    if (!investorId) return;
    setError("");
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/docusign/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ investorId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.alreadySigned) {
          router.push(`/apply/${fundSlug}/step/5/complete?event=signing_complete`);
          return;
        }
        throw new Error(data.error ?? "Failed to load signing session");
      }
      setSigningUrl(data.signingUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load signing session");
    } finally {
      setLoading(false);
    }
  }, [investorId, fundSlug, getAccessToken, router]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  if (!investorId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Session expired. Please start from Step 1.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
        <p className="mt-4 text-sm text-slate-600">Loading document...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchSession}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!signingUrl) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Unable to load document. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Sign Subscription Agreement</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review and sign the subscription agreement below. This may take a few minutes.
      </p>

      <div className="mt-6 w-full overflow-hidden rounded-lg border border-slate-200">
        <iframe
          src={signingUrl}
          title="DocuSign signing"
          className="h-[600px] w-full min-h-[400px] md:min-h-[600px] sm:min-h-[80vh]"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
