// apps/web/src/lib/stripe/client.ts
import Stripe from "stripe";
import { getEnvVar } from "@onvest/config";
import {
  getSubscriptionByGpId,
  upsertSubscription,
  updateSubscription,
} from "@onvest/db";
import type { SubscriptionRow } from "@onvest/db";

let _stripe: Stripe | null = null;

/** Stripe server client (singleton). */
function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = getEnvVar("STRIPE_SECRET_KEY", true);
  if (!key) throw new Error("STRIPE_SECRET_KEY is required");
  _stripe = new Stripe(key);
  return _stripe;
}

/** Plan limits: maxFunds, maxInvestors. Founding = Pro limits. */
const PLAN_LIMITS: Record<SubscriptionRow["plan"], { maxFunds: number; maxInvestors: number }> = {
  starter: { maxFunds: 1, maxInvestors: 25 },
  growth: { maxFunds: 3, maxInvestors: 100 },
  pro: { maxFunds: Infinity, maxInvestors: Infinity },
  founding: { maxFunds: Infinity, maxInvestors: Infinity },
};

/**
 * Creates a Stripe customer for the GP and saves to subscriptions table.
 * If GP already has a subscription with stripe_customer_id, returns that customer ID.
 * @returns stripe_customer_id
 */
export async function createCustomer(
  gpId: string,
  email: string,
  name: string
): Promise<string> {
  const existing = await getSubscriptionByGpId(gpId);
  if (existing?.stripe_customer_id) {
    return existing.stripe_customer_id;
  }

  const stripe = getStripe();
  const customer = await stripe.customers.create({ email, name });
  await upsertSubscription({
    gp_id: gpId,
    stripe_customer_id: customer.id,
    plan: "starter",
    status: "trialing",
  });
  return customer.id;
}

/**
 * Creates a Stripe Checkout session for subscription.
 * success_url and cancel_url should include fundId if needed.
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  fundId: string | null,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: fundId ? { fundId } : {},
    subscription_data: { metadata: fundId ? { fundId } : {} },
  });
  if (!session.url) throw new Error("Checkout session URL not returned");
  return session.url;
}

/**
 * Returns subscription with plan limits.
 */
export async function getSubscription(
  subscriptionId: string
): Promise<{
  plan: SubscriptionRow["plan"];
  status: string;
  currentPeriodEnd: Date | null;
  maxFunds: number;
  maxInvestors: number;
} | null> {
  const stripe = getStripe();
  const sub = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ["items.data.price"],
  });
  const priceId = sub.items.data[0]?.price?.id;
  const plan = priceIdToPlan(priceId);
  const limits = getPlanLimits(plan);
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
  return {
    plan,
    status: sub.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    maxFunds: limits.maxFunds,
    maxInvestors: limits.maxInvestors,
  };
}

function priceIdToPlan(priceId: string | undefined): SubscriptionRow["plan"] {
  const starter = getEnvVar("STRIPE_PRICE_STARTER");
  const growth = getEnvVar("STRIPE_PRICE_GROWTH");
  const pro = getEnvVar("STRIPE_PRICE_PRO");
  if (priceId === starter) return "starter";
  if (priceId === growth) return "growth";
  if (priceId === pro) return "pro";
  return "pro";
}

/**
 * Creates a Stripe Customer Portal session for managing subscription.
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  const stripe = getStripe();
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session.url;
}

/**
 * Cancel subscription at period end.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const stripe = getStripe();
  await stripe.subscriptions.update(subscriptionId, { cancel_at_period_end: true });
}

/**
 * Returns plan limits.
 */
export function getPlanLimits(
  plan: SubscriptionRow["plan"]
): { maxFunds: number; maxInvestors: number } {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;
}
