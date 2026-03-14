// apps/web/src/app/api/billing/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, requireRole } from "@/lib/auth";
import { getProfileById } from "@onvest/db";
import { createCustomer, createCheckoutSession } from "@/lib/stripe/client";
import { getEnvVar } from "@onvest/config";

const bodySchema = z.object({
  priceId: z.string().min(1, "Price ID is required").optional(),
  plan: z.enum(["starter", "growth", "pro"]).optional(),
  fundId: z.string().uuid().optional().nullable(),
});

function getPriceIdForPlan(plan: string): string | null {
  const map: Record<string, string | undefined> = {
    starter: process.env.STRIPE_PRICE_STARTER,
    growth: process.env.STRIPE_PRICE_GROWTH,
    pro: process.env.STRIPE_PRICE_PRO,
  };
  return map[plan] ?? null;
}

/**
 * POST /api/billing/checkout
 * Creates or retrieves Stripe customer, creates checkout session.
 * Returns { checkoutUrl }.
 */
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  requireRole(session, "gp");

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid body";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const priceId = body.priceId ?? (body.plan ? getPriceIdForPlan(body.plan) : null);
  if (!priceId) {
    return NextResponse.json(
      { error: "Price ID or plan required. Configure STRIPE_PRICE_* in env." },
      { status: 400 }
    );
  }

  const appUrl = getEnvVar("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  const successUrl = body.fundId
    ? `${appUrl}/dashboard/settings/billing?success=true&fundId=${body.fundId}`
    : `${appUrl}/dashboard/settings/billing?success=true`;
  const cancelUrl = body.fundId
    ? `${appUrl}/dashboard/funds/${body.fundId}`
    : `${appUrl}/dashboard/settings/billing?canceled=true`;

  try {
    const profile = await getProfileById(session.profile.id);
    const email = profile?.email ?? session.user.email;
    const name = profile?.full_name ?? "User";
    if (!email) {
      return NextResponse.json(
        { error: "Profile email required for billing" },
        { status: 400 }
      );
    }

    const customerId = await createCustomer(session.profile.id, email, name);
    const checkoutUrl = await createCheckoutSession(
      customerId,
      priceId,
      body.fundId ?? null,
      successUrl,
      cancelUrl
    );

    return NextResponse.json({ checkoutUrl });
  } catch (e) {
    console.error("Billing checkout error:", e);
    const message = e instanceof Error ? e.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
