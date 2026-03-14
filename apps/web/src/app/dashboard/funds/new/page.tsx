"use client";

// apps/web/src/app/dashboard/funds/new/page.tsx - 5-step fund creation wizard
import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { z } from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "onvest_fund_wizard";

const step1Schema = z.object({
  name: z.string().min(1, "Name required").max(200),
  fund_type: z.enum(["llc", "lp", "reit", "506b", "506c"]).optional(),
  target_raise_cents: z.number().int().positive("Enter target raise"),
  min_investment_cents: z.number().int().nonnegative("Min must be 0 or more"),
});

const step2Schema = z.object({
  jurisdiction: z.string().min(1).default("US"),
  accreditation_standard: z.string().optional(),
  kyc_required: z.boolean().default(true),
});

const step3Schema = z.object({
  ppm_uploaded: z.boolean(),
  operating_agreement_uploaded: z.boolean(),
  subscription_template_uploaded: z.boolean(),
});

const step4Schema = z.object({
  logo_url: z.string().url().optional().or(z.literal("")),
  accent_color: z.string().default("#1D4ED8"),
  custom_domain: z.string().optional(),
});

type FormState = Record<string, unknown>;

function getStoredState(): FormState {
  if (typeof window === "undefined") return {};
  try {
    const s = sessionStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

function saveState(state: FormState) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const STEPS = [
  { n: 1, title: "Basic info" },
  { n: 2, title: "Compliance" },
  { n: 3, title: "Documents" },
  { n: 4, title: "Branding" },
  { n: 5, title: "Review & launch" },
];

export default function NewFundPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = searchParams.get("step");
  const step = Math.min(5, Math.max(1, parseInt(stepParam ?? "1", 10) || 1));
  const { getAccessToken } = usePrivy();
  const [state, setState] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setState(getStoredState());
  }, []);

  const update = useCallback((patch: FormState) => {
    const next = { ...state, ...patch };
    setState(next);
    saveState(next);
  }, [state]);

  const go = (s: number) => {
    router.replace(`/dashboard/funds/new?step=${s}`);
  };

  const validateStep = (): boolean => {
    setErrors({});
    if (step === 1) {
      const r = step1Schema.safeParse(state);
      if (!r.success) {
        const e: Record<string, string> = {};
        for (const err of r.error.issues) {
          const p = String(err.path[0] ?? "form");
          e[p] = err.message ?? "Invalid";
        }
        setErrors(e);
        return false;
      }
    }
    if (step === 2) {
      const r = step2Schema.safeParse(state);
      if (!r.success) {
        setErrors({ form: "Please fill required fields" });
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    if (step < 5) go(step + 1);
  };

  const handleBack = () => {
    if (step > 1) go(step - 1);
  };

  const handleSubmit = async () => {
    const r1 = step1Schema.safeParse(state);
    if (!r1.success) {
      setErrors({ form: "Please complete step 1" });
      return;
    }
    setSubmitting(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: r1.data.name,
          fund_type: r1.data.fund_type ?? null,
          target_raise_cents: r1.data.target_raise_cents,
          min_investment_cents: r1.data.min_investment_cents,
          jurisdiction: (state.jurisdiction as string) || "US",
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Failed to create fund");
      }
      const fund = await res.json();
      sessionStorage.removeItem(STORAGE_KEY);
      router.replace(`/dashboard/funds/${fund.id}`);
    } catch (e) {
      setErrors({ form: e instanceof Error ? e.message : "Failed" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/funds" className="text-slate-500 hover:text-slate-700">
          ← Funds
        </Link>
        <span className="text-slate-400">/</span>
        <span className="font-medium">Create Fund</span>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {STEPS.map((s) => (
          <button
            key={s.n}
            type="button"
            onClick={() => s.n < step && go(s.n)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-center text-sm font-medium transition-colors",
              step === s.n && "border-[#1D4ED8] bg-blue-50 text-[#1D4ED8]",
              step > s.n && "border-slate-200 bg-slate-50 text-slate-600",
              step < s.n && "border-slate-200 text-slate-400"
            )}
          >
            {s.n}. {s.title}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic information</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fund name</label>
              <input
                type="text"
                value={(state.name as string) ?? ""}
                onChange={(e) => update({ name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="My Real Estate Fund"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Fund type</label>
              <select
                value={(state.fund_type as string) ?? ""}
                onChange={(e) => update({ fund_type: e.target.value || undefined })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="">Select</option>
                <option value="llc">LLC</option>
                <option value="lp">LP</option>
                <option value="reit">REIT</option>
                <option value="506b">506(b)</option>
                <option value="506c">506(c)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Target raise (cents)</label>
              <input
                type="number"
                value={state.target_raise_cents !== undefined ? String(state.target_raise_cents) : ""}
                onChange={(e) => update({ target_raise_cents: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="100000000"
              />
              {errors.target_raise_cents && (
                <p className="mt-1 text-sm text-red-600">{errors.target_raise_cents}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Min investment (cents)</label>
              <input
                type="number"
                value={state.min_investment_cents !== undefined ? String(state.min_investment_cents) : ""}
                onChange={(e) => update({ min_investment_cents: parseInt(e.target.value, 10) || 0 })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="50000"
              />
              {errors.min_investment_cents && (
                <p className="mt-1 text-sm text-red-600">{errors.min_investment_cents}</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Compliance</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Jurisdiction</label>
              <input
                type="text"
                value={(state.jurisdiction as string) ?? "US"}
                onChange={(e) => update({ jurisdiction: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(state.kyc_required as boolean) ?? true}
                  onChange={(e) => update({ kyc_required: e.target.checked })}
                />
                <span className="text-sm">KYC required</span>
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Documents</h2>
            <p className="text-sm text-slate-500">
              Required documents. Upload UI coming in a later sprint — for now, confirm you will provide these.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(state.ppm_uploaded as boolean) ?? false}
                  onChange={(e) => update({ ppm_uploaded: e.target.checked })}
                />
                PPM (Private Placement Memorandum)
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(state.operating_agreement_uploaded as boolean) ?? false}
                  onChange={(e) => update({ operating_agreement_uploaded: e.target.checked })}
                />
                Operating Agreement
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={(state.subscription_template_uploaded as boolean) ?? false}
                  onChange={(e) => update({ subscription_template_uploaded: e.target.checked })}
                />
                Subscription Agreement template
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Branding</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700">Accent color</label>
              <input
                type="color"
                value={(state.accent_color as string) ?? "#1D4ED8"}
                onChange={(e) => update({ accent_color: e.target.value })}
                className="mt-1 h-10 w-20 cursor-pointer rounded border border-slate-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Custom domain (optional)</label>
              <input
                type="text"
                value={(state.custom_domain as string) ?? ""}
                onChange={(e) => update({ custom_domain: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                placeholder="invest.example.com"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Review & launch</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-slate-500">Name</dt>
                <dd className="font-medium">{String(state.name ?? "—")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Type</dt>
                <dd className="font-medium">{(state.fund_type as string) ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Target raise</dt>
                <dd className="font-medium">${(Number(state.target_raise_cents) || 0) / 100}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Min investment</dt>
                <dd className="font-medium">${(Number(state.min_investment_cents) || 0) / 100}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Jurisdiction</dt>
                <dd className="font-medium">{(state.jurisdiction as string) ?? "US"}</dd>
              </div>
            </dl>
            {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
          </div>
        )}

        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={step === 1}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50 hover:bg-slate-50"
          >
            Back
          </button>
          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e40af]"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-lg bg-[#1D4ED8] px-4 py-2 text-sm font-medium text-white disabled:opacity-70 hover:bg-[#1e40af]"
            >
              {submitting ? "Creating…" : "Create fund"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
