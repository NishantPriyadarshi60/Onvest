// apps/web/src/app/api/investors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getFundsByGpId, getInvestorsByFundId } from "@onvest/db";

/**
 * GET - List all investors across GP's funds (with accreditation type).
 */
export async function GET() {
  const session = await requireAuth();
  requireRole(session, "gp");

  const funds = await getFundsByGpId(session.profile.id);
  const allInvestors: Array<import("@onvest/db").InvestorRow & { fund_name?: string }> = [];

  for (const fund of funds) {
    const investors = await getInvestorsByFundId(fund.id);
    for (const inv of investors) {
      allInvestors.push({ ...inv, fund_name: fund.name });
    }
  }

  return NextResponse.json(allInvestors);
}
