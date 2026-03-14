// apps/web/src/app/api/kyc/create-inquiry/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import { getProfileByPrivyId, getInvestorById, updateInvestor } from "@onvest/db";
import { createInquiry, resumeInquiry } from "@/lib/persona/client";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
});

/**
 * POST - Create or resume a Persona KYC inquiry.
 * Returns sessionToken and inquiryId for the Persona embed.
 * Requires authenticated LP session; investor must belong to user's profile.
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

  try {
    if (investor.kyc_inquiry_id) {
      const { sessionToken } = await resumeInquiry(investor.kyc_inquiry_id);
      return NextResponse.json({
        sessionToken,
        inquiryId: investor.kyc_inquiry_id,
      });
    }

    const { inquiryId, sessionToken } = await createInquiry(
      investor.id,
      investor.email
    );

    await updateInvestor(investor.id, { kyc_inquiry_id: inquiryId });

    return NextResponse.json({ sessionToken, inquiryId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create inquiry";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
