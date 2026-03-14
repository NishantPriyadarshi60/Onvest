"use client";

// apps/web/src/hooks/useAuth.ts
import { usePrivy } from "@privy-io/react-auth";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type { ProfileRow } from "@onvest/db";

interface UseAuthResult {
  user: { id: string; email?: string } | null;
  profile: ProfileRow | null;
  isGP: boolean;
  isLP: boolean;
  isLoading: boolean;
  logout: () => Promise<void>;
}

/**
 * Client-side auth hook. Combines Privy user state with Supabase profile.
 * @returns { user, profile, isGP, isLP, isLoading, logout }
 */
export function useAuth(): UseAuthResult {
  const { user: privyUser, authenticated, ready, logout: privyLogout, getAccessToken } = usePrivy();

  const { data, isLoading: profileLoading } = useQuery({
    queryKey: ["auth", "me", authenticated ? privyUser?.id : null],
    queryFn: async () => {
      if (!authenticated || !privyUser) return null;
      const token = await getAccessToken();
      const res = await fetch("/api/auth/me", {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        credentials: "include",
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json as { user: { privyId: string; email: string }; profile: ProfileRow };
    },
    enabled: !!authenticated && !!privyUser && ready,
    staleTime: 60 * 1000,
  });

  const logout = useCallback(async () => {
    await privyLogout();
  }, [privyLogout]);

  const isLoading = !ready || (authenticated && profileLoading);
  const profile = data?.profile ?? null;
  const role = profile?.role;

  return {
    user: privyUser
      ? {
          id: privyUser.id,
          email: privyUser.email?.address ?? data?.user?.email,
        }
      : null,
    profile,
    isGP: role === "gp",
    isLP: role === "lp",
    isLoading,
    logout,
  };
}
