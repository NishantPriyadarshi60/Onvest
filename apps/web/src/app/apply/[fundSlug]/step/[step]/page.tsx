"use client";

// Dynamic step router - redirects to step 1 if steps 1-2 not completed
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApplicationState } from "@/hooks/useApplicationState";
import { ApplyStep1 } from "@/components/apply/ApplyStep1";
import { ApplyStep2 } from "@/components/apply/ApplyStep2";
import { ApplyStep3 } from "@/components/apply/ApplyStep3";
import { ApplyStep4 } from "@/components/apply/ApplyStep4";
import { ApplyStep5 } from "@/components/apply/ApplyStep5";
import { ApplyStep6 } from "@/components/apply/ApplyStep6";
import { ApplyStep7 } from "@/components/apply/ApplyStep7";

export default function ApplyStepPage() {
  const params = useParams();
  const router = useRouter();
  const fundSlug = params.fundSlug as string;
  const stepNum = parseInt(params.step as string, 10);
  const { canAccessStep } = useApplicationState(fundSlug);

  useEffect(() => {
    if (stepNum >= 1 && stepNum <= 7 && !canAccessStep(stepNum)) {
      router.replace(`/apply/${fundSlug}/step/1`);
    }
  }, [stepNum, fundSlug, canAccessStep, router]);

  if (stepNum < 1 || stepNum > 7) {
    router.replace(`/apply/${fundSlug}/step/1`);
    return null;
  }

  if (stepNum === 1) return <ApplyStep1 fundSlug={fundSlug} />;
  if (stepNum === 2) return <ApplyStep2 fundSlug={fundSlug} />;
  if (stepNum === 3) return <ApplyStep3 fundSlug={fundSlug} />;
  if (stepNum === 4) return <ApplyStep4 fundSlug={fundSlug} />;
  if (stepNum === 5) return <ApplyStep5 fundSlug={fundSlug} />;
  if (stepNum === 6) return <ApplyStep6 fundSlug={fundSlug} />;
  if (stepNum === 7) return <ApplyStep7 fundSlug={fundSlug} />;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-slate-600">Step {stepNum} coming soon.</p>
    </div>
  );
}
