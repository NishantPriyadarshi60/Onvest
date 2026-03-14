"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApplicationState, type Step2Data } from "@/hooks/useApplicationState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/FormField";

interface ApplyStep2Props {
  fundSlug: string;
}

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "India",
  "Japan",
  "Mexico",
  "Brazil",
  "Other",
];

function parseDate(s: string): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function is18Plus(dob: string): boolean {
  const d = parseDate(dob);
  if (!d) return false;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age >= 18;
}

function ssnLast4Valid(v: string): boolean {
  return /^\d{4}$/.test(v) || v === "";
}

export function ApplyStep2({ fundSlug }: ApplyStep2Props) {
  const router = useRouter();
  const { stepData, updateStep } = useApplicationState(fundSlug);
  const existing: Partial<Step2Data> = stepData().step2 ?? {};

  const [firstName, setFirstName] = useState(existing.firstName ?? "");
  const [middleName, setMiddleName] = useState(existing.middleName ?? "");
  const [lastName, setLastName] = useState(existing.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(existing.dateOfBirth ?? "");
  const [street, setStreet] = useState(existing.street ?? "");
  const [city, setCity] = useState(existing.city ?? "");
  const [stateProvince, setStateProvince] = useState(existing.stateProvince ?? "");
  const [country, setCountry] = useState(existing.country ?? "");
  const [zip, setZip] = useState(existing.zip ?? "");
  const [nationality, setNationality] = useState(existing.nationality ?? "");
  const [ssnLast4, setSsnLast4] = useState(existing.ssnLast4 ?? "");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isUS = country === "United States" || nationality === "United States";

  const persist = () => {
    updateStep("step2", {
      firstName,
      middleName,
      lastName,
      dateOfBirth,
      street,
      city,
      stateProvince,
      country,
      zip,
      nationality,
      ssnLast4: isUS ? ssnLast4 : "",
    });
  };

  const validate = (): Record<string, string> => {
    const err: Record<string, string> = {};
    if (!firstName.trim()) err.firstName = "First name is required";
    if (!lastName.trim()) err.lastName = "Last name is required";
    if (!dateOfBirth) err.dateOfBirth = "Date of birth is required";
    else if (!is18Plus(dateOfBirth)) err.dateOfBirth = "You must be at least 18 years old";
    if (!street.trim()) err.street = "Street address is required";
    if (!city.trim()) err.city = "City is required";
    if (!country.trim()) err.country = "Country is required";
    if (!zip.trim()) err.zip = "ZIP / postal code is required";
    if (!nationality.trim()) err.nationality = "Nationality is required";
    if (isUS && !ssnLast4) err.ssnLast4 = "SSN last 4 digits required for US nationals";
    else if (isUS && !ssnLast4Valid(ssnLast4)) err.ssnLast4 = "SSN last 4 must be 4 digits";
    return err;
  };

  const handleContinue = () => {
    const err = validate();
    setFieldErrors(err);
    if (Object.keys(err).length > 0) return;
    persist();
    router.push(`/apply/${fundSlug}/step/3`);
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="text-xl font-semibold text-slate-900">Step 2: Personal information</h1>
      <p className="mt-1 text-sm text-slate-600">We need this for compliance and KYC.</p>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          handleContinue();
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
        <div className="grid gap-4 sm:grid-cols-3">
          <FormField
            label="First name"
            required
            error={fieldErrors.firstName}
            success={!!firstName.trim() && !fieldErrors.firstName}
          >
            <Input
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFieldErrors((p) => ({ ...p, firstName: "" }));
              }}
              onBlur={persist}
            />
          </FormField>
          <FormField label="Middle name" success={!!middleName.trim()}>
            <Input
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
              onBlur={persist}
            />
          </FormField>
          <FormField
            label="Last name"
            required
            error={fieldErrors.lastName}
            success={!!lastName.trim() && !fieldErrors.lastName}
          >
            <Input
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setFieldErrors((p) => ({ ...p, lastName: "" }));
              }}
              onBlur={persist}
            />
          </FormField>
        </div>

        <FormField
          label="Date of birth (must be 18+)"
          required
          error={fieldErrors.dateOfBirth}
          success={!!dateOfBirth && is18Plus(dateOfBirth)}
        >
          <Input
            type="date"
            value={dateOfBirth}
            onChange={(e) => {
              setDateOfBirth(e.target.value);
              setFieldErrors((p) => ({ ...p, dateOfBirth: "" }));
            }}
            onBlur={persist}
          />
        </FormField>

        <FormField
          label="Street address"
          required
          error={fieldErrors.street}
          success={!!street.trim() && !fieldErrors.street}
        >
          <Input
            value={street}
            onChange={(e) => {
              setStreet(e.target.value);
              setFieldErrors((p) => ({ ...p, street: "" }));
            }}
            onBlur={persist}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="City"
            required
            error={fieldErrors.city}
            success={!!city.trim() && !fieldErrors.city}
          >
            <Input
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setFieldErrors((p) => ({ ...p, city: "" }));
              }}
              onBlur={persist}
            />
          </FormField>
          <FormField label="State / Province" success={!!stateProvince.trim()}>
            <Input
              value={stateProvince}
              onChange={(e) => setStateProvince(e.target.value)}
              onBlur={persist}
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FormField
              label="Country"
              required
              error={fieldErrors.country}
              success={!!country.trim() && !fieldErrors.country}
            >
              <Input
                value={country}
                onChange={(e) => {
                  setCountry(e.target.value);
                  setFieldErrors((p) => ({ ...p, country: "" }));
                }}
                list="country-list"
              />
            </FormField>
            <datalist id="country-list">
              {COUNTRIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <FormField
            label="ZIP / Postal code"
            required
            error={fieldErrors.zip}
            success={!!zip.trim() && !fieldErrors.zip}
          >
            <Input
              value={zip}
              onChange={(e) => {
                setZip(e.target.value);
                setFieldErrors((p) => ({ ...p, zip: "" }));
              }}
              onBlur={persist}
            />
          </FormField>
        </div>

        <FormField
          label="Nationality"
          required
          error={fieldErrors.nationality}
          success={!!nationality.trim() && !fieldErrors.nationality}
        >
            <Input
              value={nationality}
              onChange={(e) => {
                setNationality(e.target.value);
                setFieldErrors((p) => ({ ...p, nationality: "" }));
              }}
              list="nationality-list"
            />
        </FormField>

        {isUS && (
          <FormField
            label="SSN last 4 digits"
            required
            error={fieldErrors.ssnLast4}
            success={!!ssnLast4 && ssnLast4Valid(ssnLast4)}
          >
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              placeholder="1234"
              value={ssnLast4}
              onChange={(e) => {
                setSsnLast4(e.target.value.replace(/\D/g, "").slice(0, 4));
                setFieldErrors((p) => ({ ...p, ssnLast4: "" }));
              }}
              onBlur={persist}
            />
          </FormField>
        )}

        <datalist id="country-list">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <datalist id="nationality-list">
          {COUNTRIES.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <Button type="submit">Continue</Button>
      </form>
    </div>
  );
}
