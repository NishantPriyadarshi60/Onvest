// apps/web/src/app/api/apply/complete-step1/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId, syncUserToSupabase } from "@/lib/auth";
import {
  getFundById,
  getInvestorByFundAndEmail,
  createInvestor,
  updateInvestor,
} from "@onvest/db";
import { z } from "zod";

const bodySchema = z.object({
  fundId: z.string().uuid(),
  email: z.string().email(),
  phone: z.string().min(1),
});

/**
 * POST - After Privy login, create LP profile and link/create investor.
 * Requires authenticated session (Privy JWT).
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

  const fund = await getFundById(body.fundId);
  if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });

  const privyUser = {
    id: privyId,
    email: { address: body.email },
  };
  const profile = await syncUserToSupabase(privyUser, "lp");

  let investor = await getInvestorByFundAndEmail(body.fundId, body.email);
  if (!investor) {
    investor = await createInvestor({
      fund_id: body.fundId,
      email: body.email,
      profile_id: profile.id,
      status: "applying",
    });
  } else {
    await updateInvestor(investor.id, {
      profile_id: profile.id,
      status: investor.status === "invited" ? "applying" : investor.status,
    });
    investor = { ...investor, profile_id: profile.id };
  }

  return NextResponse.json({
    ok: true,
    investorId: investor.id,
    profileId: profile.id,
  });
}
