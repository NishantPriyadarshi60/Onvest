-- RWA Platform Initial Schema
-- Tables are in public schema (Supabase default).
-- For custom schema (e.g. Onvest): run "CREATE SCHEMA IF NOT EXISTS \"Onvest\";" first,
-- then replace public. with "Onvest". in this file before running.

-- profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL CHECK (role IN ('gp', 'lp', 'admin')),
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- funds
CREATE TABLE IF NOT EXISTS public.funds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gp_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- investors (one row per LP per fund)
CREATE TABLE IF NOT EXISTS public.investors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid NOT NULL REFERENCES public.funds(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id),
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
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  investor_id uuid REFERENCES public.investors(id) ON DELETE CASCADE,
  fund_id uuid REFERENCES public.funds(id) ON DELETE CASCADE,
  type text CHECK (type IN (
    'ppm', 'operating_agreement', 'subscription_agreement',
    'accreditation_doc', 'government_id', 'signed_subscription', 'other'
  )),
  storage_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now()
);

-- activity_log
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fund_id uuid REFERENCES public.funds(id),
  investor_id uuid REFERENCES public.investors(id),
  actor_id uuid REFERENCES public.profiles(id),
  action text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- subscriptions (Stripe billing)
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gp_id uuid NOT NULL REFERENCES public.profiles(id),
  stripe_customer_id text NOT NULL UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan text CHECK (plan IN ('starter', 'growth', 'pro', 'founding')),
  status text DEFAULT 'active',
  current_period_end timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_investors_fund_id ON public.investors(fund_id);
CREATE INDEX IF NOT EXISTS idx_investors_email ON public.investors(email);
CREATE INDEX IF NOT EXISTS idx_investors_status ON public.investors(status);
CREATE INDEX IF NOT EXISTS idx_funds_gp_id ON public.funds(gp_id);
CREATE INDEX IF NOT EXISTS idx_funds_slug ON public.funds(slug);
CREATE INDEX IF NOT EXISTS idx_activity_log_fund_id ON public.activity_log(fund_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_investor_id ON public.activity_log(investor_id);

-- updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at triggers (profiles, funds, investors have updated_at)
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_funds_updated_at
  BEFORE UPDATE ON public.funds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER set_investors_updated_at
  BEFORE UPDATE ON public.investors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: enable on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- profiles: users see only their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- funds: GPs see only their own funds
CREATE POLICY "funds_select_gp"
  ON public.funds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'gp' AND p.id = funds.gp_id
    )
  );

CREATE POLICY "funds_insert_gp"
  ON public.funds FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'gp' AND p.id = gp_id
    )
  );

CREATE POLICY "funds_update_gp"
  ON public.funds FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'gp' AND p.id = funds.gp_id
    )
  );

-- investors: GPs see investors in their funds; LPs see their own rows
CREATE POLICY "investors_select_gp"
  ON public.investors FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funds f
      JOIN public.profiles p ON p.id = f.gp_id
      WHERE f.id = investors.fund_id AND p.id = auth.uid() AND p.role = 'gp'
    )
  );

CREATE POLICY "investors_select_lp"
  ON public.investors FOR SELECT
  USING (
    profile_id = auth.uid() OR
    (profile_id IS NULL AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.email = investors.email AND p.id = auth.uid()
    ))
  );

CREATE POLICY "investors_insert_gp"
  ON public.investors FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.funds f
      JOIN public.profiles p ON p.id = f.gp_id
      WHERE f.id = fund_id AND p.id = auth.uid() AND p.role = 'gp'
    )
  );

CREATE POLICY "investors_update"
  ON public.investors FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.funds f
      JOIN public.profiles p ON p.id = f.gp_id
      WHERE f.id = investors.fund_id AND p.id = auth.uid() AND p.role = 'gp'
    ) OR profile_id = auth.uid()
  );

-- documents: GPs see docs for their fund investors; LPs see their own
CREATE POLICY "documents_select_gp"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investors i
      JOIN public.funds f ON f.id = i.fund_id
      JOIN public.profiles p ON p.id = f.gp_id
      WHERE i.id = documents.investor_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "documents_select_lp"
  ON public.documents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.investors i
      WHERE i.id = documents.investor_id AND i.profile_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert"
  ON public.documents FOR INSERT
  WITH CHECK (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.investors i
      JOIN public.funds f ON f.id = i.fund_id
      WHERE i.id = investor_id AND f.gp_id = auth.uid()
    )
  );

-- activity_log: GPs see activity for their funds
CREATE POLICY "activity_log_select"
  ON public.activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.funds f
      JOIN public.profiles p ON p.id = f.gp_id
      WHERE f.id = activity_log.fund_id AND p.id = auth.uid()
    )
  );

CREATE POLICY "activity_log_insert"
  ON public.activity_log FOR INSERT
  WITH CHECK (actor_id = auth.uid());

-- subscriptions: GPs see only their own
CREATE POLICY "subscriptions_select"
  ON public.subscriptions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.id = subscriptions.gp_id
    )
  );

CREATE POLICY "subscriptions_insert"
  ON public.subscriptions FOR INSERT
  WITH CHECK (gp_id = auth.uid());
