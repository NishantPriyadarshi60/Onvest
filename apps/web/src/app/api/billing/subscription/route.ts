// apps/web/src/app/api/billing/subscription/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getSubscriptionByGpId } from "@onvest/db";

/**
 * GET /api/billing/subscription
 * Returns current subscription for GP.
 */
export async function GET() {
  const session = await requireAuth();
  requireRole(session, "gp");

  const sub = await getSubscriptionByGpId(session.profile.id);
  if (!sub) {
    return NextResponse.json({
      hasSubscription: false,
      plan: null,
      status: null,
      currentPeriodEnd: null,
    });
  }

  return NextResponse.json({
    hasSubscription: true,
    plan: sub.plan,
    status: sub.status,
    currentPeriodEnd: sub.current_period_end,
  });
}
