"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";

interface ApplyStep7Props {
  fundSlug: string;
}

function truncateAddress(addr: string) {
  if (!addr || addr.length <= 10) return addr ?? "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

function formatCurrency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ApplyStep7({ fundSlug }: ApplyStep7Props) {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { stepData } = useApplicationState(fundSlug);
  const investorId = stepData().step1?.investorId;

  const [investor, setInvestor] = useState<{
    full_name: string | null;
    email: string;
    nationality?: string;
    accreditation_type: string | null;
    accreditation_doc_path: string | null;
    kyc_status: string;
    doc_signed_at: string | null;
    wallet_address: string | null;
    subscription_amount_cents: number | null;
    fund_name?: string;
  } | null>(null);
  const [fund, setFund] = useState<{
    min_investment_cents: number;
    target_raise_cents: number;
  } | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const step2 = stepData().step2;

  useEffect(() => {
    if (!investorId) return;
    const load = async () => {
      const token = await getAccessToken();
      const res = await fetch(`/api/investors/${investorId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const inv = await res.json();
      setInvestor(inv);
      const fundRes = await fetch(`/api/funds/by-slug/${fundSlug}`);
      if (fundRes.ok) {
        const f = await fundRes.json();
        setFund(f);
        if (inv.subscription_amount_cents != null) {
          setAmount(String(inv.subscription_amount_cents / 100));
        }
      }
      const docRes = await fetch(
        `/api/documents/signed-subscription?investorId=${investorId}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (docRes.ok) {
        const { url } = await docRes.json();
        setDownloadUrl(url);
      }
    };
    load();
  }, [investorId, fundSlug, getAccessToken]);

  const handleSubmit = async () => {
    setFieldErrors({});
    if (!investorId) return;
    if (!acknowledged) {
      setFieldErrors({ acknowledged: "Please confirm the acknowledgment to continue." });
      return;
    }

    let amountCents = investor?.subscription_amount_cents ?? 0;
    if (needsAmountInput && fund) {
      const amountNum = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;
      amountCents = amountNum * 100;
      if (amountCents < fund.min_investment_cents || amountCents > fund.target_raise_cents) {
        setFieldErrors({
          amount: `Amount must be between ${formatCurrency(fund.min_investment_cents)} and ${formatCurrency(fund.target_raise_cents)}`,
        });
        return;
      }
    } else if (!amountCents && fund) {
      amountCents = fund.min_investment_cents;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch(`/api/investors/${investorId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          subscriptionAmountCents: amountCents,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to submit");
      router.push(`/apply/${fundSlug}/success`);
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Failed to submit" });
    } finally {
      setLoading(false);
    }
  };

  if (!investorId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <p className="text-slate-600">Session expired. Please start from Step 1.</p>
        <Button className="mt-4" onClick={() => router.push(`/apply/${fundSlug}/step/1`)}>
          Start over
        </Button>
      </div>
    );
  }

  const fullName =
    investor?.full_name ??
    (step2?.firstName || step2?.lastName
      ? [step2.firstName, step2.middleName, step2.lastName].filter(Boolean).join(" ")
      : "—");
  const nationality = step2?.nationality ?? investor?.nationality ?? "—";
  const accLabel =
    investor?.accreditation_type?.replace(/_/g, " ") ?? "—";
  const accDoc = investor?.accreditation_doc_path
    ? "Document uploaded"
    : "—";
  const signedDate = formatDate(investor?.doc_signed_at ?? null);

  const minCents = fund?.min_investment_cents ?? 0;
  const maxCents = fund?.target_raise_cents ?? 0;
  const needsAmountInput = fund && !investor?.subscription_amount_cents;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Review & Submit</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review your application before submitting.
      </p>

      {Object.keys(fieldErrors).length > 0 && (
        <div
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          Please fix the errors below before continuing.
        </div>
      )}
      <div className="mt-6 space-y-4">
        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">Personal Info</h2>
          <p className="mt-1 text-slate-900">{fullName}</p>
          <p className="text-sm text-slate-600">{investor?.email ?? stepData().step1?.email}</p>
          <p className="text-sm text-slate-600">Nationality: {nationality}</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">Accreditation</h2>
          <p className="mt-1 text-slate-900">{accLabel}</p>
          <p className="text-sm text-slate-600">{accDoc}</p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">KYC</h2>
          <p className="mt-1 flex items-center gap-2 text-slate-900">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">✓</span>
            Verified by Persona
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">Agreement</h2>
          <p className="mt-1 text-slate-900">
            {signedDate ? `Signed ${signedDate}` : "—"}
          </p>
          {downloadUrl && (
            <a
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-slate-600 underline hover:text-slate-900"
            >
              Download signed agreement
            </a>
          )}
        </div>

        <div className="rounded-lg border border-slate-200 p-4">
          <h2 className="text-sm font-medium text-slate-700">Wallet</h2>
          <p className="mt-1 font-mono text-slate-900">
            {investor?.wallet_address ? truncateAddress(investor.wallet_address) : "—"}
          </p>
          <p className="text-xs text-slate-500">Polygon</p>
        </div>

        {needsAmountInput && (
          <div className="rounded-lg border border-slate-200 p-4">
            <FormField
              label="Investment Amount"
              required
              error={fieldErrors.amount}
              success={
                !!amount &&
                (() => {
                  const n = parseInt(amount.replace(/[^0-9]/g, ""), 10) || 0;
                  const c = n * 100;
                  return fund ? c >= minCents && c <= maxCents : false;
                })()
              }
            >
              <Input
                type="text"
                placeholder="e.g. 50000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value.replace(/[^0-9]/g, ""));
                  setFieldErrors((p) => ({ ...p, amount: "" }));
                }}
                className="font-mono"
              />
            </FormField>
            <p className="mt-1 text-xs text-slate-500">
              Min: {formatCurrency(minCents)} — Max: {formatCurrency(maxCents)} (USD)
            </p>
          </div>
        )}
      </div>

      <div className="mt-6">
        <label className={`flex cursor-pointer items-start gap-3 ${fieldErrors.acknowledged ? "rounded-md border border-red-200 bg-red-50 p-3" : ""}`}>
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => {
              setAcknowledged(e.target.checked);
              setFieldErrors((p) => ({ ...p, acknowledged: "" }));
            }}
            className="mt-1 h-4 w-4 rounded border-slate-300"
          />
          <span className="text-sm text-slate-700">
            I confirm all information provided is accurate and I am an accredited investor under
            applicable securities laws. *
          </span>
        </label>
        {fieldErrors.acknowledged && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.acknowledged}</p>
        )}
      </div>

      {fieldErrors.form && <p className="mt-4 text-sm text-red-600">{fieldErrors.form}</p>}

      <Button
        className="mt-6"
        loading={loading}
        onClick={handleSubmit}
        disabled={!acknowledged || loading}
      >
        {loading ? "Submitting…" : "Submit Application"}
      </Button>
    </div>
  );
}
