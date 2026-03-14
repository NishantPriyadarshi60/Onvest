// apps/web/src/app/api/invite/validate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInviteToken } from "@/lib/invite-jwt";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
  }
  const payload = await verifyInviteToken(token);
  if (!payload) {
    return NextResponse.json({ valid: false, error: "Invalid or expired" }, { status: 200 });
  }
  return NextResponse.json({
    valid: true,
    email: payload.email,
    fundId: payload.fundId,
  });
}
