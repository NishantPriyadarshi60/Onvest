/** DB row types matching Supabase schema (001_initial_schema). */

export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: "gp" | "lp" | "admin";
  avatar_url: string | null;
  privy_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FundRow {
  id: string;
  gp_id: string;
  name: string;
  slug: string;
  description: string | null;
  fund_type: "llc" | "lp" | "reit" | "506b" | "506c" | null;
  target_raise_cents: number;
  min_investment_cents: number;
  jurisdiction: string;
  status: "draft" | "active" | "closed";
  branding: Record<string, unknown>;
  token_config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type InvestorStatus =
  | "invited"
  | "applying"
  | "kyc_pending"
  | "kyc_failed"
  | "accreditation_pending"
  | "docs_pending"
  | "approved"
  | "rejected"
  | "funded"
  | "whitelisted";

export interface InvestorRow {
  id: string;
  fund_id: string;
  profile_id: string | null;
  email: string;
  full_name: string | null;
  status: InvestorStatus;
  invited_at: string;
  kyc_inquiry_id: string | null;
  kyc_status: string;
  kyc_result: Record<string, unknown>;
  kyc_completed_at: string | null;
  accreditation_type: string | null;
  accreditation_doc_path: string | null;
  subscription_amount_cents: number | null;
  docusign_envelope_id: string | null;
  doc_signed_at: string | null;
  wallet_address: string | null;
  is_whitelisted: boolean;
  whitelist_tx_hash: string | null;
  token_balance: string;
  gp_notes: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export type DocumentType =
  | "ppm"
  | "operating_agreement"
  | "subscription_agreement"
  | "accreditation_doc"
  | "government_id"
  | "signed_subscription"
  | "other";

export interface DocumentRow {
  id: string;
  investor_id: string | null;
  fund_id: string | null;
  type: DocumentType;
  storage_path: string;
  file_name: string;
  uploaded_by: string | null;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  fund_id: string | null;
  investor_id: string | null;
  actor_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type SubscriptionPlan = "starter" | "growth" | "pro" | "founding";

export interface SubscriptionRow {
  id: string;
  gp_id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  plan: SubscriptionPlan;
  status: string;
  current_period_end: string | null;
  created_at: string;
}

/** Supabase Database type for typed client. */
export interface Database {
  public: {
    Tables: {
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      funds: { Row: FundRow; Insert: Partial<FundRow>; Update: Partial<FundRow> };
      investors: { Row: InvestorRow; Insert: Partial<InvestorRow>; Update: Partial<InvestorRow> };
      documents: { Row: DocumentRow; Insert: Partial<DocumentRow>; Update: Partial<DocumentRow> };
      activity_log: { Row: ActivityLogRow; Insert: Partial<ActivityLogRow>; Update: Partial<ActivityLogRow> };
      subscriptions: { Row: SubscriptionRow; Insert: Partial<SubscriptionRow>; Update: Partial<SubscriptionRow> };
    };
  };
}
