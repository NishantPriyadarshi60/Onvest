"use client";

// apps/web/src/app/(auth)/login/page.tsx
import { useLogin, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

async function fetchMeWithToken(getAccessToken: () => Promise<string | null>) {
  const token = await getAccessToken();
  const res = await fetch("/api/auth/me", {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    credentials: "include",
  });
  return res.ok ? res.json() : null;
}

export default function LoginPage() {
  const { ready, authenticated, getAccessToken } = usePrivy();
  const router = useRouter();

  const redirectByProfile = useCallback(
    async (getToken: () => Promise<string | null>) => {
      const data = await fetchMeWithToken(getToken);
      const profile = data?.profile as { role?: string } | null;
      if (!profile) router.replace("/onboarding/role-select");
      else if (profile.role === "gp") router.replace("/dashboard");
      else router.replace("/investor/status");
    },
    [router]
  );

  const { login } = useLogin({
    onComplete: () => {
      redirectByProfile(getAccessToken);
    },
  });

  useEffect(() => {
    if (!ready || !authenticated) return;
    redirectByProfile(getAccessToken);
  }, [ready, authenticated, redirectByProfile, getAccessToken]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md border-slate-200 shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Sign in to Onvest
          </CardTitle>
          <CardDescription>
            Investor onboarding and compliance for real estate syndicators
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {ready ? (
            <button
              type="button"
              onClick={login}
              disabled={authenticated}
              className={cn(
                "inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#1D4ED8] px-4 font-medium text-white transition-colors",
                "hover:bg-[#1e40af] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2",
                "disabled:pointer-events-none disabled:opacity-60"
              )}
            >
              {authenticated ? "Redirecting..." : "Log in"}
            </button>
          ) : (
            <div className="flex h-11 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-500">
              Loading...
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            Sign in with email or wallet via Privy
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
