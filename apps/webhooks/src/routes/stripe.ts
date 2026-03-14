/**
 * Stripe webhook handler - S6-1
 * HMAC verify, handle checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
 */
import type { Request, Response } from "express";
import Stripe from "stripe";
import {
  getProfileById,
  updateSubscription,
  getSubscriptionByStripeCustomerId,
} from "@onvest/db";
import { sendEmail, GpWelcome, SubscriptionCanceled, PaymentFailed } from "@onvest/email";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function stripeHandler(req: Request, res: Response): Promise<void> {
  if (!WEBHOOK_SECRET || !stripe) {
    res.status(500).json({ error: "Stripe not configured" });
    return;
  }

  const rawBody = req.body;
  if (!rawBody || (!Buffer.isBuffer(rawBody) && typeof rawBody !== "string")) {
    res.status(400).json({ error: "Raw body required for webhook verification" });
    return;
  }

  const sig = req.headers["stripe-signature"];
  if (!sig || typeof sig !== "string") {
    res.status(401).json({ error: "Missing stripe-signature" });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    res.status(401).json({ error: message });
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        if (!customerId || !subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = sub.items.data[0]?.price?.id;
        const plan = priceIdToPlan(priceId);
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await updateSubscription(customerId, {
          stripe_subscription_id: subscriptionId,
          plan,
          status: sub.status,
          current_period_end: periodEnd,
        });

        const row = await getSubscriptionByStripeCustomerId(customerId);
        if (row) {
          const profile = await getProfileById(row.gp_id);
          const email = profile?.email;
          const name = profile?.full_name ?? "there";
          if (email) {
            try {
              await sendEmail({
                to: email,
                subject: "Welcome to Onvest",
                react: GpWelcome({ gpName: name, planName: planDisplay(plan) }),
              });
            } catch (e) {
              console.error("GpWelcome email failed:", e);
            }
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;
        await updateSubscription(customerId, {
          status: "canceled",
          stripe_subscription_id: sub.id,
        });

        const row = await getSubscriptionByStripeCustomerId(customerId);
        if (row) {
          const profile = await getProfileById(row.gp_id);
          const email = profile?.email;
          if (email) {
            try {
              await sendEmail({
                to: email,
                subject: "Your Onvest subscription has been canceled",
                react: SubscriptionCanceled(),
              });
            } catch (e) {
              console.error("Cancellation email failed:", e);
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const periodEnd = sub.current_period_end
            ? new Date(sub.current_period_end * 1000).toISOString()
            : null;
          await updateSubscription(customerId, {
            status: sub.status,
            current_period_end: periodEnd,
          });
        }

        const row = await getSubscriptionByStripeCustomerId(customerId);
        if (row) {
          const profile = await getProfileById(row.gp_id);
          const email = profile?.email;
          if (email) {
            try {
              await sendEmail({
                to: email,
                subject: "Payment failed - Onvest",
                react: PaymentFailed(),
              });
            } catch (e) {
              console.error("Payment failure email failed:", e);
            }
          }
        }
        break;
      }

      default:
        break;
    }
  } catch (e) {
    console.error("Stripe webhook error:", e);
  }

  res.status(200).json({ received: true });
}

function priceIdToPlan(priceId: string | undefined): "starter" | "growth" | "pro" | "founding" {
  const starter = process.env.STRIPE_PRICE_STARTER;
  const growth = process.env.STRIPE_PRICE_GROWTH;
  const pro = process.env.STRIPE_PRICE_PRO;
  if (priceId === starter) return "starter";
  if (priceId === growth) return "growth";
  if (priceId === pro) return "pro";
  return "pro";
}

function planDisplay(plan: string): string {
  const m: Record<string, string> = {
    starter: "Starter",
    growth: "Growth",
    pro: "Pro",
    founding: "Founding",
  };
  return m[plan] ?? plan;
}
