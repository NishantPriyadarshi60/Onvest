"use client";

// Persists LP application step data in sessionStorage

export interface Step1Data {
  email: string;
  phone: string;
  investorId?: string;
}

export interface Step2Data {
  firstName: string;
  middleName: string;
  lastName: string;
  dateOfBirth: string;
  street: string;
  city: string;
  stateProvince: string;
  country: string;
  zip: string;
  nationality: string;
  ssnLast4: string;
}

export interface Step3Data {
  accreditationType: string;
  accreditationDocPath?: string;
  licenseNumber?: string;
  licenseType?: string;
}

export interface Step4Data {
  completed?: boolean;
}

export interface Step5Data {
  completed?: boolean;
}

export interface Step6Data {
  completed?: boolean;
  walletAddress?: string;
}

export type ApplicationStepData = {
  step1?: Step1Data;
  step2?: Step2Data;
  step3?: Step3Data;
  step4?: Step4Data;
  step5?: Step5Data;
  step6?: Step6Data;
};

const STORAGE_PREFIX = "onvest-apply-";

function getStorageKey(fundSlug: string): string {
  return `${STORAGE_PREFIX}${fundSlug}`;
}

export function useApplicationState(fundSlug: string) {
  const key = getStorageKey(fundSlug);

  const stepData = (): ApplicationStepData => {
    if (typeof window === "undefined") return {};
    try {
      const raw = sessionStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const updateStep = <K extends keyof ApplicationStepData>(
    step: K,
    data: ApplicationStepData[K]
  ) => {
    if (typeof window === "undefined") return;
    try {
      const current = stepData();
      const next = { ...current, [step]: data };
      sessionStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const clearApplication = () => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  };

  const getCompletedSteps = (): number[] => {
    const data = stepData();
    const steps: number[] = [];
    if (data.step1?.email) steps.push(1);
    if (data.step2?.firstName && data.step2?.lastName && data.step2?.dateOfBirth && data.step2?.country) steps.push(2);
    if (data.step3?.accreditationType) steps.push(3);
    if (data.step4?.completed) steps.push(4);
    if (data.step5?.completed) steps.push(5);
    if (data.step6?.completed) steps.push(6);
    return steps;
  };

  const canAccessStep = (step: number): boolean => {
    if (step <= 1) return true;
    const completed = getCompletedSteps();
    for (let s = 1; s < step; s++) {
      if (!completed.includes(s)) return false;
    }
    return true;
  };

  return {
    stepData,
    updateStep,
    clearApplication,
    getCompletedSteps,
    canAccessStep,
  };
}
