-- Onvest schema: all tables in "Onvest" (for DATABASE_SCHEMA=Onvest).
-- Requires: auth.users. For local Postgres without Supabase, we create minimal auth schema.

-- Auth schema and minimal auth.users (so profiles.id can FK to it)
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

CREATE SCHEMA IF NOT EXISTS "Onvest";

-- profiles
CREATE TABLE IF NOT EXISTS "Onvest".profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('gp', 'lp', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- funds
CREATE TABLE IF NOT EXISTS "Onvest".funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gp_id uuid NOT NULL REFERENCES "Onvest".profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  fund_type text CHECK (fund_type IN ('llc', 'lp', 'reit', '506b', '506c')),
  target_raise_cents bigint NOT NULL,
  min_investment_cents bigint NOT NULL,
  jurisdiction text DEFAULT 'US',
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  branding jsonb DEFAULT '{}',
  token_config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- investors
CREATE TABLE IF NOT EXISTS "Onvest".investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES "Onvest".funds(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES "Onvest".profiles(id),
  email text NOT NULL,
  full_name text,
  status text DEFAULT 'invited' CHECK (status IN (
    'invited', 'applying', 'kyc_pending', 'kyc_failed',
    'accreditation_pending', 'docs_pending', 'approved', 'rejected',
    'funded', 'whitelisted'
  )),
  invited_at timestamptz DEFAULT now(),
  kyc_inquiry_id text,
  kyc_status text DEFAULT 'not_started',
  kyc_result jsonb DEFAULT '{}',
  kyc_completed_at timestamptz,
  accreditation_type text,
  accreditation_doc_path text,
  subscription_amount_cents bigint,
  docusign_envelope_id text,
  doc_signed_at timestamptz,
  wallet_address text,
  is_whitelisted boolean DEFAULT false,
  whitelist_tx_hash text,
  token_balance text DEFAULT '0',
  gp_notes text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(fund_id, email)
);

-- documents
CREATE TABLE IF NOT EXISTS "Onvest".documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES "Onvest".investors(id) ON DELETE CASCADE,
  fund_id uuid REFERENCES "Onvest".funds(id) ON DELETE CASCADE,
  type text CHECK (type IN (
    'ppm', 'operating_agreement', 'subscription_agreement',
    'accreditation_doc', 'government_id', 'signed_subscription', 'other'
  )),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES "Onvest".profiles(id),
  created_at timestamptz DEFAULT now()
);

-- activity_log
CREATE TABLE IF NOT EXISTS "Onvest".activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid REFERENCES "Onvest".funds(id),
  investor_id uuid REFERENCES "Onvest".investors(id),
  actor_id uuid REFERENCES "Onvest".profiles(id),
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- subscriptions
CREATE TABLE IF NOT EXISTS "Onvest".subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gp_id uuid NOT NULL REFERENCES "Onvest".profiles(id),
  stripe_customer_id text NOT NULL UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan text CHECK (plan IN ('starter', 'growth', 'pro', 'founding')),
  status text DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_onvest_investors_fund_id ON "Onvest".investors(fund_id);
CREATE INDEX IF NOT EXISTS idx_onvest_investors_email ON "Onvest".investors(email);
CREATE INDEX IF NOT EXISTS idx_onvest_investors_status ON "Onvest".investors(status);
CREATE INDEX IF NOT EXISTS idx_onvest_funds_gp_id ON "Onvest".funds(gp_id);
CREATE INDEX IF NOT EXISTS idx_onvest_funds_slug ON "Onvest".funds(slug);
CREATE INDEX IF NOT EXISTS idx_onvest_activity_log_fund_id ON "Onvest".activity_log(fund_id);
CREATE INDEX IF NOT EXISTS idx_onvest_activity_log_investor_id ON "Onvest".activity_log(investor_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION "Onvest".update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON "Onvest".profiles
  FOR EACH ROW EXECUTE PROCEDURE "Onvest".update_updated_at_column();
CREATE TRIGGER set_funds_updated_at
  BEFORE UPDATE ON "Onvest".funds
  FOR EACH ROW EXECUTE PROCEDURE "Onvest".update_updated_at_column();
CREATE TRIGGER set_investors_updated_at
  BEFORE UPDATE ON "Onvest".investors
  FOR EACH ROW EXECUTE PROCEDURE "Onvest".update_updated_at_column();
