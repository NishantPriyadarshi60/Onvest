// apps/web/src/app/api/kyc/complete-step4/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import { getProfileByPrivyId, getInvestorById, updateInvestor } from "@onvest/db";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
});

/**
 * POST - Mark step 4 (KYC) complete - update investor status to kyc_pending.
 * Called when Persona onComplete fires (user submitted KYC).
 */
export async function POST(req: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await getProfileByPrivyId(privyId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const investor = await getInvestorById(body.investorId);
  if (!investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  if (investor.profile_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await updateInvestor(investor.id, { status: "kyc_pending" });

  return NextResponse.json({ ok: true });
}
