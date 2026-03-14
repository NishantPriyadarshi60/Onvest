"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useApplicationState } from "@/hooks/useApplicationState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";

interface ApplyStep1Props {
  fundSlug: string;
}

const emailSchema = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const phoneSchema = (v: string) => v.length >= 10;

export function ApplyStep1({ fundSlug }: ApplyStep1Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { stepData, updateStep, canAccessStep } = useApplicationState(fundSlug);
  const { getAccessToken } = usePrivy();
  const { sendCode, loginWithCode } = useLoginWithEmail({
    onComplete: () => {},
    onError: (err) => setFieldErrors((p) => ({ ...p, form: String(err) })),
  });

  const [email, setEmail] = useState(stepData().step1?.email ?? "");
  const [phone, setPhone] = useState(stepData().step1?.phone ?? "");
  const [code, setCode] = useState("");
  const [phase, setPhase] = useState<"form" | "awaiting-code" | "submitting">("form");
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(!!token);
  const [expired, setExpired] = useState(false);
  const [fundId, setFundId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      fetch(`/api/invite/validate?token=${encodeURIComponent(token)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.valid && d.email) setEmail(d.email);
          if (d.valid && d.fundId) setFundId(d.fundId);
          if (!d.valid) setExpired(true);
        })
        .finally(() => setValidatingToken(false));
    }
    if (!fundId && !token) {
      fetch(`/api/funds/by-slug/${fundSlug}`)
        .then((r) => r.json())
        .then((d) => d.id && setFundId(d.id));
    }
  }, [token, fundSlug, fundId]);

  const checkHasAccount = async () => {
    const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email.trim())}`);
    const data = await res.json();
    setHasAccount(data.hasAccount ?? false);
  };

  const validateForm = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (!email.trim()) err.email = "Email is required";
    else if (!emailSchema(email.trim())) err.email = "Invalid email format";
    if (!phone.trim()) err.phone = "Phone is required";
    else if (!phoneSchema(phone)) err.phone = "Phone must be at least 10 digits";
    return err;
  };

  const handleSendCode = async () => {
    setFieldErrors({});
    const err = validateForm();
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }
    setLoading(true);
    try {
      await sendCode({ email: email.trim(), disableSignup: hasAccount === true });
      setPhase("awaiting-code");
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Failed to send code" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setFieldErrors({});
    if (!code.trim() || code.length < 4) {
      setFieldErrors({ code: "Enter the 6-digit code from your email" });
      return;
    }
    setLoading(true);
    setPhase("submitting");
    try {
      await loginWithCode({ code: code.trim() });
      let fid = fundId;
      if (!fid) {
        const fr = await fetch(`/api/funds/by-slug/${fundSlug}`);
        const fd = await fr.json();
        fid = fd?.id ?? null;
      }
      const accessToken = await getAccessToken();
      if (!fid || !accessToken) throw new Error("Missing fund or session");
      const res = await fetch("/api/apply/complete-step1", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ fundId: fid, email: email.trim(), phone: phone.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to create account");
      updateStep("step1", { email: email.trim(), phone: phone.trim(), investorId: data.investorId });
      router.push(`/apply/${fundSlug}/step/2`);
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Verification failed" });
      setPhase("awaiting-code");
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Link expired</h1>
        <p className="mt-2 text-slate-600">Please request a new invite from the fund manager.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Step 1: Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">Enter your details to continue.</p>

      {phase === "form" ? (
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (hasAccount === null) checkHasAccount().then(() => handleSendCode());
            else handleSendCode();
          }}
        >
          {Object.keys(fieldErrors).length > 0 && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              Please fix the errors below before continuing.
            </div>
          )}
          <FormField
            label="Email address"
            required
            error={fieldErrors.email}
            success={!!email.trim() && emailSchema(email.trim())}
          >
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((p) => ({ ...p, email: "", form: "" }));
              }}
              onBlur={() => hasAccount === null && email.includes("@") && checkHasAccount()}
            />
          </FormField>
          <FormField
            label="Phone (for 2FA)"
            required
            error={fieldErrors.phone}
            success={!!phone.trim() && phoneSchema(phone)}
          >
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setFieldErrors((p) => ({ ...p, phone: "" }));
              }}
            />
          </FormField>
          {hasAccount && (
            <p className="text-sm text-slate-600">
              You already have an account. We&apos;ll send a code to log in.
            </p>
          )}
          {fieldErrors.form && (
            <p className="text-sm text-red-600" role="alert">{fieldErrors.form}</p>
          )}
          <Button type="submit" loading={loading} disabled={loading}>
            {loading ? "Sending…" : hasAccount ? "Continue with existing account" : "Create account"}
          </Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-slate-600">
            Enter the 6-digit code sent to {email}
          </p>
          <FormField
            label="Verification code"
            error={fieldErrors.code}
            success={code.length >= 4 && code.length <= 6}
          >
            <Input
              placeholder="000000"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                setFieldErrors((p) => ({ ...p, code: "", form: "" }));
              }}
              maxLength={6}
            />
          </FormField>
          {fieldErrors.form && (
            <p className="text-sm text-red-600" role="alert">{fieldErrors.form}</p>
          )}
          <div className="flex gap-2">
            <Button onClick={handleVerifyCode} loading={loading} disabled={loading || code.length < 4}>
              {loading ? "Verifying…" : "Verify"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhase("form")}
              disabled={loading}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
