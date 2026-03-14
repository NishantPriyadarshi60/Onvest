// apps/web/src/app/api/investors/[investorId]/whitelist/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getInvestorById, getFundById } from "@onvest/db";
import { addToWhitelist, getWhitelistStatus } from "@/lib/blockchain/fundService";
import { getChainId } from "@/lib/blockchain/client";
import { getEnvVar } from "@onvest/config";

/**
 * POST - Add investor wallet to token whitelist (GP only).
 * Verifies GP owns the fund, investor is approved and has wallet_address,
 * fund has contract_addr in token_config.
 * Returns { txHash, polygonscanUrl }.
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

  const contractAddr = (fund.token_config as Record<string, unknown>)?.contract_addr;
  if (!contractAddr || typeof contractAddr !== "string") {
    return NextResponse.json(
      { error: "Fund does not have a deployed token contract" },
      { status: 400 }
    );
  }

  if (investor.status !== "approved") {
    return NextResponse.json(
      { error: "Investor must be approved before whitelisting" },
      { status: 400 }
    );
  }

  if (!investor.wallet_address) {
    return NextResponse.json(
      { error: "Investor has no wallet address on file" },
      { status: 400 }
    );
  }

  try {
    const isAlready = await getWhitelistStatus(contractAddr, investor.wallet_address);
    if (isAlready) {
      const chainId = getChainId();
      const baseUrl =
        chainId === 137
          ? "https://polygonscan.com"
          : chainId === 80002
            ? "https://amoy.polygonscan.com"
            : "https://polygonscan.com";
      return NextResponse.json({
        alreadyWhitelisted: true,
        message: "Address is already whitelisted",
        polygonscanUrl: investor.whitelist_tx_hash
          ? `${baseUrl}/tx/${investor.whitelist_tx_hash}`
          : undefined,
      });
    }

    const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
    const { txHash, blockNumber } = await addToWhitelist(
      contractAddr,
      investor.wallet_address,
      investorId,
      {
        fundId: fund.id,
        actorId: session.profile.id,
        investorEmail: investor.email,
        investorName: investor.full_name ?? investor.email,
        fundName: fund.name,
        gpEmail: session.profile.email,
        dashboardUrl: `${appUrl}/dashboard/investors`,
      }
    );

    const chainId = getChainId();
    const baseUrl =
      chainId === 137
        ? "https://polygonscan.com"
        : chainId === 80002
          ? "https://amoy.polygonscan.com"
          : "https://polygonscan.com";
    const polygonscanUrl = `${baseUrl}/tx/${txHash}`;

    return NextResponse.json({ txHash, blockNumber, polygonscanUrl });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Blockchain transaction failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
