// apps/web/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** API paths that require JWT validation. */
const API_AUTH_PATHS = "/api/";

/** Paths that skip API auth (e.g. webhooks, public invite validation, internal send-invite). */
const API_AUTH_SKIP_PREFIXES = [
  "/api/webhooks/",
  "/api/send-invite",
  "/api/invite/validate",
  "/api/auth/check-email",
  "/api/funds/by-slug/",
];

function hasAuthToken(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return true;
  const token = request.cookies.get("privy-token")?.value;
  return !!token;
}

function requiresApiAuth(pathname: string): boolean {
  if (!pathname.startsWith(API_AUTH_PATHS)) return false;
  if (API_AUTH_SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return false;
  return true;
}

/**
 * /api/* routes (except /api/webhooks/*): require JWT in Authorization header or privy-token cookie.
 * /dashboard/* and /investor/*: AuthGuard in layout handles client-side auth + role enforcement.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (requiresApiAuth(pathname) && !hasAuthToken(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
