// apps/web/src/app/api/investors/[investorId]/reject/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getInvestorById, getFundById, updateInvestor, insertActivityLog } from "@onvest/db";
import { sendEmail, LpRejected } from "@onvest/email";
import { z } from "zod";

const bodySchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

/**
 * POST - Reject investor (GP only).
 * Requires GP auth and fund ownership.
 * Sends rejection email to LP, logs activity.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const session = await requireAuth();
  requireRole(session, "gp");

  const { investorId } = await params;
  const investor = await getInvestorById(investorId);
  if (!investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  const fund = await getFundById(investor.fund_id);
  if (!fund || fund.gp_id !== session.profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  await updateInvestor(investorId, {
    status: "rejected",
    rejection_reason: body.reason,
  });

  const investorName = investor.full_name ?? investor.email;

  try {
    await sendEmail({
      to: investor.email,
      subject: `Application update for ${fund.name}`,
      react: LpRejected({
        investorName,
        fundName: fund.name,
        reason: body.reason,
      }),
    });
  } catch (e) {
    console.error("Rejection email failed:", e);
  }

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: session.profile.id,
    action: "investor_rejected",
    metadata: { reason: body.reason },
  });

  return NextResponse.json({ ok: true });
}
