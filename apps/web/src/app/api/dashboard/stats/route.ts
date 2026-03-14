// apps/web/src/app/api/dashboard/stats/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import {
  getFundsByGpId,
  getRecentActivityForGp,
  countInvestorsByStatusForGp,
} from "@onvest/db";

/**
 * GET /api/dashboard/stats - Dashboard stats for authenticated GP.
 */
export async function GET() {
  const session = await getServerSession();
  if (!session || session.profile.role !== "gp") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [funds, activity, investorCounts] = await Promise.all([
    getFundsByGpId(session.profile.id),
    getRecentActivityForGp(session.profile.id, 5),
    countInvestorsByStatusForGp(session.profile.id),
  ]);

  return NextResponse.json({
    funds,
    activity,
    investorCounts,
  });
}
