"use client";

// apps/web/src/components/AuthGuard.tsx
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireRole: "gp" | "lp";
}

/**
 * Client-side guard for protected routes. Redirects unauthenticated users to /login
 * and enforces role (GP cannot access LP routes, LP cannot access GP routes).
 */
export function AuthGuard({ children, requireRole }: AuthGuardProps) {
  const { user, profile, isGP, isLP, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (requireRole === "gp" && !isGP) {
      router.replace("/investor/status");
      return;
    }
    if (requireRole === "lp" && !isLP) {
      router.replace("/dashboard");
      return;
    }
  }, [user, isGP, isLP, isLoading, requireRole, router]);

  if (isLoading || !user) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }
  if (requireRole === "gp" && !isGP) return null;
  if (requireRole === "lp" && !isLP) return null;

  return <>{children}</>;
}
