// apps/web/src/app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";

/**
 * GET /api/auth/me - Returns current user and profile if authenticated.
 * Returns 401 when no valid token or no profile (e.g. new user → redirect to onboarding).
 */
export async function GET() {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized", user: null, profile: null },
      { status: 401 }
    );
  }
  return NextResponse.json({
    user: session.user,
    profile: session.profile,
  });
}
