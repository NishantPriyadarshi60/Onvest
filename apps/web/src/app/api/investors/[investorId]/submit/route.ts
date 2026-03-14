// apps/web/src/app/api/investors/[investorId]/submit/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import {
  getProfileByPrivyId,
  getInvestorById,
  getFundById,
  getProfileById,
  updateInvestor,
  insertActivityLog,
} from "@onvest/db";
import { sendEmail, ApplicationReceived, NewApplication } from "@onvest/email";
import { z } from "zod";

const bodySchema = z.object({
  subscriptionAmountCents: z.number().int().min(0).optional(),
});

/**
 * POST - Submit application (final step).
 * LP auth; investor must belong to profile.
 * Validates all steps complete, updates status, sends emails, logs.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { investorId } = await params;
  const profile = await getProfileByPrivyId(privyId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const investor = await getInvestorById(investorId);
  if (!investor || investor.profile_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fund = await getFundById(investor.fund_id);
  if (!fund) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  // Validate required steps
  if (!investor.email) {
    return NextResponse.json({ error: "Step 1 not complete" }, { status: 400 });
  }
  if (!investor.full_name) {
    return NextResponse.json({ error: "Step 2 not complete" }, { status: 400 });
  }
  if (!investor.accreditation_type) {
    return NextResponse.json({ error: "Step 3 not complete" }, { status: 400 });
  }
  if (investor.kyc_status !== "approved") {
    return NextResponse.json({ error: "KYC not complete" }, { status: 400 });
  }
  if (!investor.doc_signed_at) {
    return NextResponse.json({ error: "Agreement not signed" }, { status: 400 });
  }
  if (!investor.wallet_address) {
    return NextResponse.json({ error: "Wallet not provided" }, { status: 400 });
  }

  let body: z.infer<typeof bodySchema> = {};
  try {
    const raw = await req.json();
    if (raw && typeof raw === "object") {
      body = bodySchema.parse(raw);
    }
  } catch {
    // optional body
  }

  const subscriptionAmountCents =
    body.subscriptionAmountCents ?? investor.subscription_amount_cents ?? fund.min_investment_cents;

  if (subscriptionAmountCents < fund.min_investment_cents) {
    return NextResponse.json(
      { error: `Minimum investment is $${(fund.min_investment_cents / 100).toLocaleString()}` },
      { status: 400 }
    );
  }

  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

  await updateInvestor(investorId, {
    status: "kyc_pending",
    subscription_amount_cents: subscriptionAmountCents,
  });

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: profile.id,
    action: "application_submitted",
    metadata: { subscription_amount_cents: subscriptionAmountCents },
  });

  const gp = await getProfileById(fund.gp_id);
  const investorName = investor.full_name ?? investor.email;

  try {
    await sendEmail({
      to: investor.email,
      subject: `Application received - ${fund.name}`,
      react: ApplicationReceived({
        investorName,
        fundName: fund.name,
        statusUrl: `${APP_URL}/investor/${investorId}/status`,
      }),
    });
  } catch (e) {
    console.error("Failed to send ApplicationReceived email:", e);
  }

  if (gp?.email) {
    try {
      await sendEmail({
        to: gp.email,
        subject: `New application: ${investorName} - ${fund.name}`,
        react: NewApplication({
          investorName,
          fundName: fund.name,
          investorEmail: investor.email,
          dashboardUrl: `${APP_URL}/dashboard/investors`,
        }),
      });
    } catch (e) {
      console.error("Failed to send NewApplication email:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
