// apps/web/src/app/api/investors/[investorId]/approve/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getInvestorById, getFundById, updateInvestor, insertActivityLog } from "@onvest/db";
import { sendEmail, InvestorApproved } from "@onvest/email";
import { addToWhitelist, getWhitelistStatus } from "@/lib/blockchain/fundService";
import { getEnvVar } from "@onvest/config";

/**
 * POST - Approve investor (GP only).
 * Requires GP auth and fund ownership.
 * Sends approval email to LP, logs activity.
 * Auto-whitelists wallet on-chain if fund has token contract and investor has wallet_address.
 */
export async function POST(
  _req: Request,
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

  await updateInvestor(investorId, { status: "approved" });

  const investorName = investor.full_name ?? investor.email;
  const fundName = fund.name;

  try {
    await sendEmail({
      to: investor.email,
      subject: `You have been approved for ${fundName}`,
      react: InvestorApproved({ investorName, fundName }),
    });
  } catch (e) {
    console.error("Approval email failed:", e);
  }

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: session.profile.id,
    action: "investor_approved",
    metadata: {},
  });

  const contractAddr = (fund.token_config as Record<string, unknown>)?.contract_addr;
  if (
    typeof contractAddr === "string" &&
    investor.wallet_address
  ) {
    try {
      const already = await getWhitelistStatus(contractAddr, investor.wallet_address);
      if (!already) {
        const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
        await addToWhitelist(contractAddr, investor.wallet_address, investorId, {
          fundId: fund.id,
          actorId: session.profile.id,
          investorEmail: investor.email,
          investorName: investor.full_name ?? investor.email,
          fundName: fund.name,
          gpEmail: session.profile.email,
          dashboardUrl: `${appUrl}/dashboard/investors`,
        });
      }
    } catch (e) {
      console.error("Auto-whitelist on approve failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
