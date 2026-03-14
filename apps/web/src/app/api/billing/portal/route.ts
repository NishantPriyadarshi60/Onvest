// apps/web/src/app/api/billing/portal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getSubscriptionByGpId } from "@onvest/db";
import { createPortalSession } from "@/lib/stripe/client";
import { getEnvVar } from "@onvest/config";

/**
 * POST /api/billing/portal
 * Creates Stripe Customer Portal session.
 * Returns { url } for redirect to manage subscription.
 */
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  requireRole(session, "gp");

  const sub = await getSubscriptionByGpId(session.profile.id);
  if (!sub?.stripe_customer_id) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 400 }
    );
  }

  const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  const returnUrl = `${appUrl}/dashboard/settings/billing`;

  try {
    const url = await createPortalSession(sub.stripe_customer_id, returnUrl);
    return NextResponse.json({ url });
  } catch (e) {
    console.error("Portal session error:", e);
    const message = e instanceof Error ? e.message : "Failed to create portal session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
