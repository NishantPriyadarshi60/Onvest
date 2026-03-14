"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";
import { PersonaEmbed } from "@/components/kyc/PersonaEmbed";

interface ApplyStep4Props {
  fundSlug: string;
}

export function ApplyStep4({ fundSlug }: ApplyStep4Props) {
  const [fundName, setFundName] = useState("this fund");

  useEffect(() => {
    fetch(`/api/funds/by-slug/${fundSlug}`)
      .then((r) => r.json())
      .then((d) => d.name && setFundName(d.name))
      .catch(() => {});
  }, [fundSlug]);
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { stepData, updateStep } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [inquiryId, setInquiryId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const fetchInquiry = useCallback(async () => {
    if (!investorId) return;
    setError("");
    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/kyc/create-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ investorId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to start verification");
      setSessionToken(data.sessionToken);
      setInquiryId(data.inquiryId);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start verification");
    } finally {
      setLoading(false);
    }
  }, [investorId, getAccessToken]);

  useEffect(() => {
    fetchInquiry();
  }, [fetchInquiry]);

  const handleComplete = useCallback(async () => {
    if (!investorId) return;
    try {
      const token = await getAccessToken();
      await fetch("/api/kyc/complete-step4", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ investorId }),
      });
      updateStep("step4", { completed: true });
      router.push(`/apply/${fundSlug}/step/5`);
    } catch {
      router.push(`/apply/${fundSlug}/step/5`);
    }
  }, [investorId, fundSlug, getAccessToken, updateStep, router]);

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
        <p className="mt-4 text-sm text-slate-600">Loading verification...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <p className="text-red-600">{error}</p>
        <button
          type="button"
          onClick={fetchInquiry}
          className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!sessionToken || !inquiryId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Unable to load verification. Please refresh the page.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Verify Your Identity</h1>
      <p className="mt-1 text-sm text-slate-600">
        This takes about 3 minutes. Have your government-issued ID ready.
      </p>

      <div className="mt-6">
        <PersonaEmbed
          sessionToken={sessionToken}
          inquiryId={inquiryId}
          referenceId={investorId}
          onComplete={handleComplete}
        />
      </div>

      <p className="mt-6 text-xs text-slate-500">
        Your ID is verified by Persona and never stored by {fundName}.
      </p>
    </div>
  );
}
