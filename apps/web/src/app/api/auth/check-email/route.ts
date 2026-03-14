// apps/web/src/app/api/auth/check-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProfileByEmail } from "@onvest/db";

/**
 * GET /api/auth/check-email?email=x - Returns whether email has an existing account.
 * Public endpoint for apply flow.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim();
  if (!email) {
    return NextResponse.json({ error: "Missing email" }, { status: 400 });
  }
  const profile = await getProfileByEmail(email);
  return NextResponse.json({ hasAccount: !!profile });
}
