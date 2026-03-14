// apps/web/src/app/api/apply/save-wallet/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import {
  getProfileByPrivyId,
  getInvestorById,
  getFundById,
  updateInvestor,
} from "@onvest/db";
import { getAddress } from "ethers";
import { getWhitelistStatus } from "@/lib/blockchain/fundService";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
  walletAddress: z.string().min(1, "Wallet address is required"),
});

/**
 * POST - Save wallet address to investor.
 * Validates address, optionally checks whitelist (when fund has contract).
 * Returns alreadyWhitelisted if address is on contract whitelist.
 */
export async function POST(req: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  let checksummedAddress: string;
  try {
    checksummedAddress = getAddress(body.walletAddress);
  } catch {
    return NextResponse.json(
      { error: "Invalid Ethereum address" },
      { status: 400 }
    );
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

  const fund = await getFundById(investor.fund_id);
  if (!fund) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  let alreadyWhitelisted = false;
  const contractAddr = (fund.token_config as Record<string, unknown>)?.contract_addr;
  if (typeof contractAddr === "string") {
    try {
      alreadyWhitelisted = await getWhitelistStatus(contractAddr, checksummedAddress);
    } catch {
      // ignore blockchain errors; save wallet regardless
    }
  }

  await updateInvestor(investor.id, {
    wallet_address: checksummedAddress,
  });

  return NextResponse.json({ ok: true, alreadyWhitelisted });
}
