"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { useApplicationState, type Step3Data } from "@/hooks/useApplicationState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";
import { AccreditationUpload } from "./AccreditationUpload";

interface ApplyStep3Props {
  fundSlug: string;
}

const METHODS = [
  {
    id: "income",
    title: "Income Method",
    description:
      "I earned $200,000+ individually (or $300,000 with spouse) in each of the last 2 years and expect the same this year",
    uploadRequired: true,
    uploadHint: "Last 2 years tax returns OR letter from CPA/attorney",
  },
  {
    id: "net_worth",
    title: "Net Worth Method",
    description: "My net worth (excluding primary residence) exceeds $1,000,000",
    uploadRequired: true,
    uploadHint: "Bank/brokerage statements OR letter from CPA/attorney",
  },
  {
    id: "professional",
    title: "Professional Certification",
    description: "I hold Series 7, Series 65, or Series 82 license",
    uploadRequired: false,
    licenseRequired: true,
    uploadHint: "",
  },
  {
    id: "entity",
    title: "Entity Method",
    description: "I am investing on behalf of an entity with $5M+ in investments",
    uploadRequired: true,
    uploadHint: "Entity formation docs + financial statements",
  },
] as const;

const LICENSE_TYPES = ["Series 7", "Series 65", "Series 82"];

export function ApplyStep3({ fundSlug }: ApplyStep3Props) {
  const router = useRouter();
  const { getAccessToken } = usePrivy();
  const { stepData, updateStep } = useApplicationState(fundSlug);
  const existing: Partial<Step3Data> = stepData().step3 ?? {};
  const investorId = stepData().step1?.investorId;

  const [selected, setSelected] = useState<string>(existing.accreditationType ?? "");
  const [docPath, setDocPath] = useState<string | null>(existing.accreditationDocPath ?? null);
  const [docFilename, setDocFilename] = useState<string>("");
  const [licenseNumber, setLicenseNumber] = useState(existing.licenseNumber ?? "");
  const [licenseType, setLicenseType] = useState(existing.licenseType ?? "");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const method = METHODS.find((m) => m.id === selected);
  const needsUpload = !!method?.uploadRequired;
  const needsLicense = !!(method && "licenseRequired" in method && method.licenseRequired);

  const validate = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (!selected) err.method = "Please select an accreditation method.";
    if (!investorId) err.form = "Session expired. Please start over from Step 1.";
    if (needsUpload && !docPath) err.upload = "Please upload the required document.";
    if (needsLicense && !licenseType) err.licenseType = "Please select your license type.";
    if (needsLicense && !licenseNumber.trim()) err.licenseNumber = "Please enter your license number.";
    return err;
  };

  const handleContinue = async () => {
    setFieldErrors({});
    const err = validate();
    if (Object.keys(err).length > 0) {
      setFieldErrors(err);
      return;
    }

    setLoading(true);
    try {
      const token = await getAccessToken();
      const res = await fetch("/api/apply/save-accreditation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          investorId,
          accreditationType: selected,
          accreditationDocPath: docPath ?? undefined,
          licenseNumber: needsLicense ? licenseNumber.trim() : undefined,
          licenseType: needsLicense ? licenseType : undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed to save");

      updateStep("step3", {
        accreditationType: selected,
        accreditationDocPath: docPath ?? undefined,
        licenseNumber: needsLicense ? licenseNumber : undefined,
        licenseType: needsLicense ? licenseType : undefined,
      });
      router.push(`/apply/${fundSlug}/step/4`);
    } catch (e) {
      setFieldErrors({ form: e instanceof Error ? e.message : "Failed to save" });
    } finally {
      setLoading(false);
    }
  };

  if (!investorId) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-slate-600">Session expired. Please start from Step 1.</p>
        <Button className="mt-4" onClick={() => router.push(`/apply/${fundSlug}/step/1`)}>
          Start over
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Step 3: Accreditation</h1>
      <p className="mt-1 text-sm text-slate-600">Select how you qualify as an accredited investor.</p>

      {Object.keys(fieldErrors).length > 0 && fieldErrors.form !== "Session expired. Please start over from Step 1." && (
        <div
          className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="alert"
        >
          Please fix the errors below before continuing.
        </div>
      )}
      <div className="mt-6 space-y-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSelected(m.id)}
            className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
              selected === m.id
                ? "border-slate-900 bg-slate-50"
                : fieldErrors.method
                  ? "border-red-500"
                  : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className="font-medium text-slate-900">{m.title}</span>
            <p className="mt-1 text-sm text-slate-600">{m.description}</p>
          </button>
        ))}
      </div>

      {selected && needsUpload && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-slate-700">{method?.uploadHint}</p>
          <AccreditationUpload
            investorId={investorId}
            onUploaded={(path, filename) => {
              setDocPath(path);
              setDocFilename(filename);
            }}
            currentPath={docPath}
            currentFilename={docFilename}
          />
        </div>
      )}

      {selected && needsLicense && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">License type *</label>
            <select
              value={licenseType}
              onChange={(e) => {
                setLicenseType(e.target.value);
                setFieldErrors((p) => ({ ...p, licenseType: "" }));
              }}
              className={`h-10 w-full rounded-md border px-3 py-2 text-sm ${
                fieldErrors.licenseType ? "border-red-500" : "border-slate-200"
              }`}
            >
              <option value="">Select...</option>
              {LICENSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            {fieldErrors.licenseType && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.licenseType}</p>
            )}
          </div>
          <FormField
            label="License number"
            required
            error={fieldErrors.licenseNumber}
            success={!!licenseNumber.trim()}
          >
            <Input
              value={licenseNumber}
              onChange={(e) => {
                setLicenseNumber(e.target.value);
                setFieldErrors((p) => ({ ...p, licenseNumber: "" }));
              }}
              placeholder="Enter license number"
            />
          </FormField>
        </div>
      )}

      {fieldErrors.upload && (
        <p className="mt-2 text-sm text-red-600">{fieldErrors.upload}</p>
      )}
      {fieldErrors.form && (
        <p className="mt-4 text-sm text-red-600">{fieldErrors.form}</p>
      )}

      <Button className="mt-6" loading={loading} onClick={handleContinue} disabled={loading}>
        {loading ? "Saving…" : "Continue"}
      </Button>
    </div>
  );
}
