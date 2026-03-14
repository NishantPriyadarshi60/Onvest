// apps/web/src/lib/auth.ts
import { headers, cookies } from "next/headers";
import { redirect } from "next/navigation";
import * as jose from "jose";
import { getProfileByPrivyId, upsertProfile } from "@onvest/db";
import type { ProfileRow } from "@onvest/db";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
const PRIVY_JWT_VERIFICATION_KEY = process.env.PRIVY_JWT_VERIFICATION_KEY ?? "";

function normalizeVerificationKey(pemOrBase64: string): string {
  const s = pemOrBase64.replace(/\\n/g, "\n").trim();
  if (s.startsWith("-----BEGIN")) return s;
  return `-----BEGIN PUBLIC KEY-----\n${s}\n-----END PUBLIC KEY-----`;
}

async function verifyPrivyToken(token: string): Promise<{ userId: string } | null> {
  if (!PRIVY_APP_ID) return null;
  try {
    if (PRIVY_JWT_VERIFICATION_KEY) {
      const key = await jose.importSPKI(
        normalizeVerificationKey(PRIVY_JWT_VERIFICATION_KEY),
        "ES256"
      );
      const { payload } = await jose.jwtVerify(token, key, {
        issuer: "privy.io",
        audience: PRIVY_APP_ID,
      });
      const userId = payload.sub as string;
      return userId ? { userId } : null;
    }
    const jwksUrl = `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`;
    const jwks = jose.createRemoteJWKSet(new URL(jwksUrl));
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: "privy.io",
      audience: PRIVY_APP_ID,
    });
    const userId = payload.sub as string;
    return userId ? { userId } : null;
  } catch {
    return null;
  }
}


export interface SessionUser {
  privyId: string;
  email: string;
}

export interface Session {
  user: SessionUser;
  profile: ProfileRow;
}

/**
 * Verifies the request's Privy JWT and returns the user ID. Does NOT require a profile.
 * Use for onboarding routes where the user may not have a profile yet.
 */
export async function getVerifiedUserId(): Promise<string | null> {
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (await cookies()).get("privy-token")?.value;
  if (!token) return null;
  const verified = await verifyPrivyToken(token);
  return verified?.userId ?? null;
}

/**
 * Gets the current user session from the Privy JWT in the request.
 * Use in server components and API routes.
 * @returns Session with user + profile, or null if unauthenticated
 */
export async function getServerSession(): Promise<Session | null> {
  let token: string | undefined;

  // Prefer Authorization header (Bearer)
  const headersList = await headers();
  const authHeader = headersList.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  } else {
    const cookieStore = await cookies();
    token = cookieStore.get("privy-token")?.value;
  }

  if (!token) return null;

  try {
    const verified = await verifyPrivyToken(token);
    if (!verified) return null;
    const privyId = verified.userId;
    if (!privyId) return null;

    const profile = await getProfileByPrivyId(privyId);
    if (!profile) return null;

    const email = profile.email;

    return {
      user: { privyId, email },
      profile,
    };
  } catch {
    return null;
  }
}

/**
 * Requires an authenticated session. Redirects to /login if none.
 * @returns Session
 */
export async function requireAuth(): Promise<Session> {
  const session = await getServerSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Requires the session user to have the given role. Throws 403 otherwise.
 * Call after requireAuth().
 * @param session - Session from requireAuth()
 * @param role - Required role: 'gp' | 'lp' | 'admin'
 */
export function requireRole(session: Session, role: "gp" | "lp" | "admin"): void {
  if (session.profile.role !== role) {
    const error = new Error("Forbidden");
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

/** Privy user shape (from usePrivy / login callback). */
export interface PrivyUser {
  id: string;
  email?: { address: string };
  linked_accounts?: Array<{ address?: string }>;
}

/**
 * Syncs a Privy user to the Supabase profiles table.
 * Inserts or updates the profile; returns the profile row.
 * @param privyUser - User object from Privy (e.g. usePrivy().user)
 * @param role - Role to set for new users
 * @returns Upserted profile
 */
export async function syncUserToSupabase(
  privyUser: PrivyUser,
  role: "gp" | "lp" | "admin" = "lp"
): Promise<ProfileRow> {
  const privyId = privyUser.id;
  const email = privyUser.email?.address ?? "";
  const fullName = email ? email.split("@")[0] : "User";

  const existing = await getProfileByPrivyId(privyId);
  const id = existing?.id ?? crypto.randomUUID();

  return upsertProfile({
    id,
    privy_id: privyId,
    full_name: fullName,
    email,
    role,
  });
}
