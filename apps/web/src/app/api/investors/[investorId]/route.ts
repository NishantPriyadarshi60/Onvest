// apps/web/src/app/api/investors/[investorId]/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getInvestorById, getFundById } from "@onvest/db";

/**
 * GET - Fetch single investor. GP: must own fund. LP: must be profile owner.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ investorId: string }> }
) {
  const session = await requireAuth();
  const { investorId } = await params;

  const investor = await getInvestorById(investorId);
  if (!investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  if (session.profile.role === "gp") {
    const fund = await getFundById(investor.fund_id);
    if (!fund || fund.gp_id !== session.profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (session.profile.role === "lp") {
    if (investor.profile_id !== session.profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fund = await getFundById(investor.fund_id);
  return NextResponse.json({
    ...investor,
    fund_name: fund?.name ?? null,
    fund_slug: fund?.slug ?? null,
  });
}
