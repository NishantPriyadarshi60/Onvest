import { createServerClient } from "./client";
import type { DocumentRow, FundRow, InvestorRow, ProfileRow, SubscriptionRow } from "./types";

export type { DocumentRow, FundRow, InvestorRow, ProfileRow, SubscriptionRow };

/** Get profile by ID. */
export async function getProfileById(id: string): Promise<ProfileRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as ProfileRow;
}

/** Get profile by Privy user ID (DID). */
export async function getProfileByPrivyId(privyId: string): Promise<ProfileRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("privy_id", privyId)
    .single();
  if (error) return null;
  return data as ProfileRow;
}

/** Get profile by email. */
export async function getProfileByEmail(email: string): Promise<ProfileRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("email", email)
    .single();
  if (error) return null;
  return data as ProfileRow;
}

/** Upsert profile (for auth sync). Requires id; include privy_id for Privy users. */
export async function upsertProfile(row: Partial<ProfileRow> & { id: string; full_name: string; email: string; role: string }) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("profiles").upsert(row as any, { onConflict: "id" })
    .select()
    .single();
  if (error) throw error;
  return data as ProfileRow;
}

/** Get funds by GP ID. */
export async function getFundsByGpId(gpId: string): Promise<FundRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("funds")
    .select("*")
    .eq("gp_id", gpId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FundRow[];
}

/** Get fund by ID. */
export async function getFundById(id: string): Promise<FundRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("funds")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as FundRow;
}

/** Get fund by slug. */
export async function getFundBySlug(slug: string): Promise<FundRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("funds")
    .select("*")
    .eq("slug", slug)
    .single();
  if (error) return null;
  return data as FundRow;
}

/** Update fund by ID. */
export async function updateFund(id: string, updates: Partial<FundRow>) {
  const supabase = createServerClient();
  // @ts-expect-error Supabase Update type inference issue with partials
  const { data, error } = await supabase.from("funds").update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as FundRow;
}

/** Create fund. */
export async function createFund(row: Omit<FundRow, "id" | "created_at" | "updated_at">) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("funds").insert(row as any)
    .select()
    .single();
  if (error) throw error;
  return data as FundRow;
}

/** Get investors by fund ID. */
export async function getInvestorsByFundId(fundId: string): Promise<InvestorRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("fund_id", fundId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as InvestorRow[];
}

/** Get investor by ID. */
export async function getInvestorById(id: string): Promise<InvestorRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data as InvestorRow;
}

/** Get recent activity for a GP's funds (by gp_id). */
export async function getRecentActivityForGp(gpId: string, limit = 10) {
  const supabase = createServerClient();
  const { data: funds } = await supabase
    .from("funds")
    .select("id")
    .eq("gp_id", gpId);
  const fundIds = (funds ?? []).map((f: { id: string }) => f.id);
  if (fundIds.length === 0) return [];
  const { data, error } = await supabase
    .from("activity_log")
    .select("*")
    .in("fund_id", fundIds)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as import("./types").ActivityLogRow[];
}

/** Count investors by status for a GP's funds. */
export async function countInvestorsByStatusForGp(gpId: string): Promise<Record<string, number>> {
  const supabase = createServerClient();
  const { data: funds } = await supabase.from("funds").select("id").eq("gp_id", gpId);
  const fundIds = (funds ?? []).map((f: { id: string }) => f.id);
  if (fundIds.length === 0) return { invited: 0, approved: 0, total: 0 };
  const { data, error } = await supabase
    .from("investors")
    .select("status")
    .in("fund_id", fundIds);
  if (error) throw error;
  const counts: Record<string, number> = { total: 0 };
  for (const row of (data ?? []) as { status: string }[]) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    counts.total++;
  }
  return counts;
}

/** Insert activity log entry. */
export async function insertActivityLog(
  row: Partial<import("./types").ActivityLogRow> & { action: string; actor_id: string }
) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("activity_log").insert(row as any).select().single();
  if (error) throw error;
  return data;
}

/** Create investor (for invite). Upserts on fund_id+email if already exists. */
export async function createInvestor(row: {
  fund_id: string;
  email: string;
  profile_id?: string | null;
  full_name?: string | null;
  status?: InvestorRow["status"];
}) {
  const supabase = createServerClient();
  const insert = {
    fund_id: row.fund_id,
    profile_id: row.profile_id ?? null,
    email: row.email,
    full_name: row.full_name ?? null,
    status: row.status ?? "invited",
    invited_at: new Date().toISOString(),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase
    .from("investors")
    .upsert(insert as any, { onConflict: "fund_id,email" })
    .select()
    .single();
  if (error) throw error;
  return data as InvestorRow;
}

/** Update investor by ID. */
export async function updateInvestor(id: string, updates: Partial<InvestorRow>) {
  const supabase = createServerClient();
  // @ts-expect-error Supabase Update type inference issue with partials
  const { data, error } = await supabase.from("investors").update(updates)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as InvestorRow;
}

/** Insert document record. */
export async function insertDocument(
  row: Omit<DocumentRow, "id" | "created_at">
) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("documents").insert(row as any).select().single();
  if (error) throw error;
  return data as DocumentRow;
}

/** Get investor by DocuSign envelope ID. */
export async function getInvestorByEnvelopeId(
  envelopeId: string
): Promise<InvestorRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("docusign_envelope_id", envelopeId)
    .single();
  if (error) return null;
  return data as InvestorRow;
}

/** Get signed subscription document for investor. */
export async function getSignedSubscriptionDoc(
  investorId: string
): Promise<DocumentRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("investor_id", investorId)
    .eq("type", "signed_subscription")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error || !data?.length) return null;
  return data[0] as DocumentRow;
}

/** Get subscription by GP ID. */
export async function getSubscriptionByGpId(gpId: string): Promise<SubscriptionRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("gp_id", gpId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data as SubscriptionRow | null;
}

/** Get subscription by Stripe customer ID. */
export async function getSubscriptionByStripeCustomerId(
  stripeCustomerId: string
): Promise<SubscriptionRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("stripe_customer_id", stripeCustomerId)
    .single();
  if (error) return null;
  return data as SubscriptionRow;
}

/** Upsert subscription (insert or update by gp_id). */
export async function upsertSubscription(row: {
  gp_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string | null;
  plan: SubscriptionRow["plan"];
  status?: string;
  current_period_end?: string | null;
}) {
  const supabase = createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from("subscriptions").upsert(
    {
      gp_id: row.gp_id,
      stripe_customer_id: row.stripe_customer_id,
      stripe_subscription_id: row.stripe_subscription_id ?? null,
      plan: row.plan,
      status: row.status ?? "active",
      current_period_end: row.current_period_end ?? null,
    } as any,
    { onConflict: "stripe_customer_id" }
  )
    .select()
    .single();
  if (error) throw error;
  return data as SubscriptionRow;
}

/** Update subscription by ID or stripe_customer_id. */
export async function updateSubscription(
  idOrCustomerId: string,
  updates: Partial<Pick<SubscriptionRow, "stripe_subscription_id" | "plan" | "status" | "current_period_end">>
) {
  const supabase = createServerClient();
  const isUuid = /^[0-9a-f-]{36}$/i.test(idOrCustomerId);
  // @ts-ignore - subscriptions table update
  let query = supabase.from("subscriptions").update(updates);
  if (isUuid) {
    query = query.eq("id", idOrCustomerId);
  } else {
    query = query.eq("stripe_customer_id", idOrCustomerId);
  }
  const { data, error } = await query.select().single();
  if (error) throw error;
  return data as SubscriptionRow;
}

/** Get investor by fund ID and email. */
export async function getInvestorByFundAndEmail(
  fundId: string,
  email: string
): Promise<InvestorRow | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("fund_id", fundId)
    .eq("email", email)
    .single();
  if (error) return null;
  return data as InvestorRow;
}
