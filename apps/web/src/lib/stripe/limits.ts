// apps/web/src/lib/stripe/limits.ts
import { getSubscriptionByGpId, getFundsByGpId, getInvestorsByFundId } from "@onvest/db";
import { getPlanLimits } from "./client";

const ACTIVE_STATUS = "active";

/**
 * Checks if GP has reached their fund limit for their plan.
 * Throws 403 if at limit or subscription is restricted.
 */
export async function checkFundLimit(gpId: string): Promise<void> {
  const sub = await getSubscriptionByGpId(gpId);
  if (!sub || sub.status !== ACTIVE_STATUS) {
    const error = new Error(
      sub?.status === "past_due"
        ? "Subscription payment is past due. Please update your payment method."
        : "No active subscription. Subscribe at Settings → Billing to create funds."
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
  const limits = getPlanLimits(sub.plan);
  if (limits.maxFunds === Infinity) return;
  const funds = await getFundsByGpId(gpId);
  if (funds.length >= limits.maxFunds) {
    const error = new Error(
      `You've reached your plan limit of ${limits.maxFunds} fund(s). Upgrade your plan to add more.`
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}

/**
 * Checks if fund has reached investor limit for GP's plan.
 * Throws 403 if at limit or subscription is restricted.
 */
export async function checkInvestorLimit(fundId: string, gpId: string): Promise<void> {
  const sub = await getSubscriptionByGpId(gpId);
  if (!sub || sub.status !== ACTIVE_STATUS) {
    const error = new Error(
      sub?.status === "past_due"
        ? "Subscription payment is past due. Please update your payment method."
        : "No active subscription. Subscribe at Settings → Billing to invite investors."
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
  const limits = getPlanLimits(sub.plan);
  if (limits.maxInvestors === Infinity) return;
  const investors = await getInvestorsByFundId(fundId);
  if (investors.length >= limits.maxInvestors) {
    const error = new Error(
      `This fund has reached the investor limit (${limits.maxInvestors}) for your plan. Upgrade to invite more.`
    );
    (error as Error & { statusCode?: number }).statusCode = 403;
    throw error;
  }
}
