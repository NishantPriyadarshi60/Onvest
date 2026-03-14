"use client";

// apps/web/src/app/onboarding/role-select/page.tsx
import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function RoleSelectPage() {
  const { user, ready, authenticated, getAccessToken, logout } = usePrivy();
  const router = useRouter();
  const [loading, setLoading] = useState<"gp" | "lp" | null>(null);

  const selectRole = async (role: "gp" | "lp") => {
    if (!user || !ready || !authenticated) return;
    setLoading(role);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No access token - try logging out and back in");
      const res = await fetch("/api/auth/onboarding/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role,
          email: user.email?.address ?? "",
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Failed to create profile");
      }
      if (role === "gp") router.replace("/dashboard");
      else router.replace("/investor/status");
    } catch (e) {
      setLoading(null);
      alert(e instanceof Error ? e.message : "Something went wrong");
    }
  };

  if (!ready || !authenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-slate-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <button
        type="button"
        onClick={async () => { await logout(); router.replace("/login"); }}
        className="absolute right-4 top-4 text-sm text-slate-500 underline hover:text-slate-700"
      >
        Log out
      </button>
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Choose your role</CardTitle>
          <CardDescription>
            Select how you&apos;ll use Onvest
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => selectRole("gp")}
            disabled={!!loading}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-6 text-left transition-colors",
              "border-slate-200 bg-white hover:border-[#1D4ED8] hover:bg-blue-50/50",
              loading && "cursor-not-allowed opacity-60"
            )}
          >
            <span className="text-2xl">🏢</span>
            <span className="font-semibold">General Partner (GP)</span>
            <span className="text-sm text-slate-500">
              Syndicators who raise capital and manage funds
            </span>
            {loading === "gp" && <span className="text-sm">Creating profile...</span>}
          </button>
          <button
            type="button"
            onClick={() => selectRole("lp")}
            disabled={!!loading}
            className={cn(
              "flex flex-col items-center gap-2 rounded-lg border-2 p-6 text-left transition-colors",
              "border-slate-200 bg-white hover:border-[#1D4ED8] hover:bg-blue-50/50",
              loading && "cursor-not-allowed opacity-60"
            )}
          >
            <span className="text-2xl">💼</span>
            <span className="font-semibold">Limited Partner (LP)</span>
            <span className="text-sm text-slate-500">
              Investors who join funds and complete KYC
            </span>
            {loading === "lp" && <span className="text-sm">Creating profile...</span>}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
