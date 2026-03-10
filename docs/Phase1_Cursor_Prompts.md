CURSOR PROMPT LIBRARY

Phase 1 - Production-Grade

Implementation Prompts

Real Estate Syndicator Onboarding Platform · 6 Sprints · 47 Prompts · Weeks 1-12

How to Use This Document

This is not a spec. This is a word-for-word prompt script. Every prompt in this library is engineered to produce production-grade output from Cursor. Follow these rules precisely:

1	Run prompts IN ORDER. Each prompt assumes the previous one was completed. Skipping creates broken dependencies.
2	Paste the CONTEXT SETUP prompt once at the start of every new Cursor session. This primes Cursor with your entire stack.
3	Do NOT paraphrase. The exact wording in prompts is intentional. Vague prompts produce vague code.
4	After each prompt, read the output critically. If something looks wrong, use the CORRECTION PROMPT provided.
5	Every prompt ends with a VERIFY section. Run those checks before moving to the next prompt.
6	The CONTEXT SETUP block must be pasted at the TOP of every new chat session in Cursor.
The prompts are ordered by Sprint (S1-S6) matching the 12-week build plan in your Phase 1 Product Spec. Each sprint = 2 weeks. Do not start a sprint until the previous sprint's verification tests pass.
Master Context Setup

Paste this block at the TOP of every new Cursor chat session before any other prompt. It primes Cursor with your entire architectural context so it never makes wrong stack decisions mid-session.

CURSOR PROMPT - COPY EXACTLY
You are a senior full-stack engineer building a production-grade B2B SaaS platform for real estate syndicators to manage investor KYC, compliance, and on-chain token whitelisting. Here is the complete technical context for this project:

PRODUCT: Investor Onboarding & Compliance Platform for RE Syndicators
TARGET USER: General Partners (GPs) who raise capital under US Reg D Rule 506b/506c

ARCHITECTURE (mandatory):
- Monorepo (pnpm workspaces + Turborepo). Frontend and API live in apps/web (Next.js). Webhooks run in a separate app.
- apps/web: Next.js 14 App Router (pages + API route handlers). Frontend talks to backend only via HTTP (REST). No direct DB or secrets in client code; use packages for shared code.
- Shared packages: types (DTOs, ApiResponse, enums), config (env validation), db (Supabase client, queries, migrations, DB types), email (React Email templates).
- apps/webhooks: Express app for Persona, DocuSign, Stripe webhooks only. Uses packages/db, packages/config, packages/email.
- apps/blockchain: Hardhat project for ERC-3643 contracts (separate from Next.js).

TECH STACK (non-negotiable, do not suggest alternatives):
apps/web: Next.js 16 LTS (16.1.6), TypeScript 5.9+, Tailwind CSS, shadcn/ui. Auth: Privy.io (Web2 email/pw + Web3 wallet). Web3: ethers.js v6, Wagmi v3. API: Next.js Route Handlers (app/api/*). No direct DB in client components—use API or server components.
Shared: Supabase (PostgreSQL + RLS + Storage + Realtime), Persona.com (KYC), DocuSign, Polygon PoS, ERC-3643, Resend, Stripe. Hosting: Vercel (apps/web), Railway (apps/webhooks). Monitoring: Sentry.
DEPENDENCY POLICY: Use the exact versions (or version ranges) specified in S1-1. All packages must be current stable releases; do not use deprecated packages (e.g. @supabase/auth-helpers-* is deprecated—use @supabase/ssr).

CODING STANDARDS (enforce on every file you generate):
- TypeScript strict mode, no 'any' types
- Backend/API: all DB access via packages/db (typed Supabase client); env via packages/config; API responses use ApiResponse<T>; Zod for request validation
- Frontend: env via config; no direct DB or server secrets; React Query or server components for data; Zod for form validation
- Every function has JSDoc with @param and @returns
- No inline styles; Tailwind only (frontend)

SECURITY RULES (never violate these):
- All investor PII in Supabase with RLS; gov ID docs only in Supabase Storage
- Persona/DocuSign/Stripe webhooks: verify HMAC/signature before processing
- GP data access enforced by RLS and backend auth
- On-chain writes only server-side with deployer wallet; deployer key only in Railway env

FILE STRUCTURE (monorepo; align with docs/folder_structure.md):
apps/web/                    # Next.js frontend + API (Route Handlers)
  src/app/                   - App Router (dashboard, apply, investor, login, api/*)
  src/components/            - Shared UI components
  src/components/ui/         - shadcn/ui (do not edit)
  src/lib/                   - utils.ts, api client (fetch to BACKEND_URL), auth (Privy), server-only libs (persona, docusign, stripe, blockchain)
  src/hooks/                 - React hooks
  .env.local.example        - NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_PRIVY_APP_ID, etc.
apps/webhooks/               # Express webhook service (standalone)
  src/                       - Express server
  src/routes/                - persona.ts, docusign.ts, stripe.ts
  - Uses packages/db, packages/config, packages/email
apps/blockchain/             # Hardhat contracts (ERC-3643)
  contracts/, scripts/, test/, hardhat.config.ts
  deployments/              - [network].json
packages/types/              # Shared TypeScript: User, Fund, Investor, ApiResponse<T>, enums (KYCStatus, etc.)
packages/config/            # Env var validation (getEnvVar, typed config)
packages/db/                 # Supabase client, queries, generated DB types, supabase/migrations/
packages/email/              # React Email templates + shared send helper

RESPONSE FORMAT:
- Always provide complete, runnable files (no truncation)
- Always include the full file path as a comment on line 1 (e.g. apps/web/src/... or packages/db/...)
- If a change touches multiple apps/packages, list all paths
- Never say 'you can add X later'—add it or mark TODO
SPRINT 1 · Weeks 1-2

Project Scaffold, Auth & Fund Creation

Supabase schema · Next.js setup · Privy auth · Fund CRUD

By end of Sprint 1: A GP can log in, create a fund with basic details, and see it on their dashboard. No investors yet.

VERSION POLICY: Next.js 16.1.6 is LTS (pin this version). All other dependencies use current stable versions as listed in S1-1; avoid deprecated packages. Re-check with npm/pnpm and official docs when in doubt.

Before starting Sprint 1, scaffold the monorepo: create root with pnpm-workspace.yaml and turbo.json; apps/web (Next.js), apps/webhooks (Express), apps/blockchain (Hardhat), and packages/types, packages/config, packages/db, packages/email. Then open the project in Cursor and paste the Master Context Setup.
S1-1	Project Bootstrap & Environment Setup
Run this FIRST before any code generation. Sets up the entire dependency tree.

CURSOR PROMPT - COPY EXACTLY
Using the tech stack and monorepo structure in my context, set up the complete project foundation.
Create the following in one response:

1. Root and app package.json files with exact versions of all dependencies. Use these current stable versions (no deprecated packages):

CORE FRAMEWORK:
- next@16.1.6 (LTS — do not use next@latest; pin to 16.1.6)
- react@^19.2.0, react-dom@^19.2.0
- typescript@^5.9.0, @types/node@^22, @types/react@^19, @types/react-dom@^19

AUTH & BACKEND:
- @supabase/supabase-js@^2.99.0
- @supabase/ssr@^0.9.0 (use this for SSR; do not use deprecated @supabase/auth-helpers-*)
- @privy-io/react-auth@^3.16.0

STATE & FORMS:
- @tanstack/react-query@^5.90.0
- react-hook-form@^7.71.0, @hookform/resolvers@^5.2.0, zod@^4.3.0

WEB3:
- wagmi@^3.5.0, viem@^2.47.0, ethers@^6.16.0

MONITORING & COMMS:
- @sentry/nextjs@^10.42.0, resend@^6.9.0

PAYMENTS:
- stripe@^20.4.0, @stripe/stripe-js@^8.9.0

EMAIL:
- react-email@^5.2.0, @react-email/components@^0.0.29 (or latest compatible with react-email 5.x)

UI:
- lucide-react@^0.576.0
- class-variance-authority@^0.7.0, clsx@^2.1.0, tailwind-merge@^3.5.0
- @radix-ui/react-dialog@^1.1.0, @radix-ui/react-dropdown-menu@^2.1.0, @radix-ui/react-select@^2.1.0, @radix-ui/react-tabs@^1.1.0
- NOTE: Do not add @radix-ui/react-badge — implement Badge as a CVA component instead

Before implementing: run `pnpm outdated` (or npm) in each package and prefer the latest stable version within the given range. Do not use deprecated packages (e.g. @supabase/auth-helpers-*; use @supabase/ssr).

2. packages/types/src/index.ts — all shared TypeScript interfaces:
- User, Fund, Investor
- KYCStatus (enum): PENDING | APPROVED | REJECTED | UNDER_REVIEW
- AccreditationType (enum): INCOME | NET_WORTH | PROFESSIONAL | INSTITUTIONAL
- InvestorStatus (enum): ACTIVE | INACTIVE | SUSPENDED
- ApiResponse<T>: { data: T; error: string | null; success: boolean }
- PaginatedResponse<T> extends ApiResponse: { items: T[]; total: number; page: number; pageSize: number; hasMore: boolean }
No 'any' types. Strict mode only.

3. packages/config/src/index.ts — typed environment variable accessor:
- getEnvVar(key, required?) helper that throws a descriptive error on missing required server vars
- Export a single typed config object validated once at module load
- NEXT_PUBLIC_* vars warn but never throw on client side
- Include vars:
  NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_PRIVY_APP_ID,
  PERSONA_API_KEY, PERSONA_WEBHOOK_SECRET,
  DOCUSIGN_INTEGRATION_KEY, DOCUSIGN_WEBHOOK_HMAC,
  STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
  NEXT_PUBLIC_POLYGON_RPC, DEPLOYER_WALLET_PRIVATE_KEY,
  RESEND_API_KEY, NEXT_PUBLIC_APP_URL

4. apps/web/.env.local.example — all vars above with empty values and a short inline comment describing each

5. apps/web/src/lib/utils.ts:
- cn() helper using clsx + tailwind-merge
- formatCurrency(amount: number, currency?: string) helper
- truncateAddress(address: string) helper for Ethereum addresses

VERIFY:
- No 'any' anywhere. Strict TypeScript throughout.
- Next.js 16.1.6 (LTS) with Turbopack as default bundler; Node.js 20.9+ required.
- wagmi v3 patterns: use WagmiProvider, not WagmiConfig; viem ^2.x.
- Privy v3 patterns: use wallets array, no deprecated setActiveWallet.
- React 19 compatible; Zod 4 with @hookform/resolvers 5.x.
- Config throws on missing server-side vars at startup.



S1-2	Supabase Schema - Complete Database Design
This is the most important prompt in the entire project. A bad schema causes compounding pain for 12 weeks. Take time to verify the output carefully.

CURSOR PROMPT - COPY EXACTLY
Create the complete Supabase PostgreSQL schema for the RWA platform. Generate a single migration file at packages/db/supabase/migrations/001_initial_schema.sqlTABLES REQUIRED:profiles (extends Supabase auth.users):id uuid PRIMARY KEY references auth.users,full_name text NOT NULL,email text NOT NULL UNIQUE,role text NOT NULL CHECK (role IN ('gp', 'lp', 'admin')),avatar_url text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now()funds:id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gp_id uuid NOT NULL references profiles(id) ON DELETE CASCADE,name text NOT NULL,slug text NOT NULL UNIQUE, -- used in investor portal URLdescription text,fund_type text CHECK (fund_type IN ('llc','lp','reit','506b','506c')),target_raise_cents bigint NOT NULL,min_investment_cents bigint NOT NULL,jurisdiction text DEFAULT 'US',status text DEFAULT 'draft' CHECK (status IN ('draft','active','closed')),branding jsonb DEFAULT '{}', -- {logo_url, accent_color, custom_domain}token_config jsonb DEFAULT '{}', -- {name, symbol, supply, chain_id, contract_addr}created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now()investors (one row per LP per fund):id uuid PRIMARY KEY DEFAULT gen_random_uuid(),fund_id uuid NOT NULL references funds(id) ON DELETE CASCADE,profile_id uuid references profiles(id), -- null until LP creates accountemail text NOT NULL,full_name text,status text DEFAULT 'invited' CHECK (status IN('invited','applying','kyc_pending','kyc_failed','accreditation_pending','docs_pending','approved','rejected','funded','whitelisted')),invited_at timestamptz DEFAULT now(),kyc_inquiry_id text, -- Persona inquiry IDkyc_status text DEFAULT 'not_started',kyc_result jsonb DEFAULT '{}', -- full Persona responsekyc_completed_at timestamptz,accreditation_type text,accreditation_doc_path text, -- Supabase storage pathsubscription_amount_cents bigint,docusign_envelope_id text,doc_signed_at timestamptz,wallet_address text,is_whitelisted boolean DEFAULT false,whitelist_tx_hash text,token_balance text DEFAULT '0',gp_notes text,rejection_reason text,created_at timestamptz DEFAULT now(),updated_at timestamptz DEFAULT now(),UNIQUE(fund_id, email)documents:id uuid PRIMARY KEY DEFAULT gen_random_uuid(),investor_id uuid references investors(id) ON DELETE CASCADE,fund_id uuid references funds(id) ON DELETE CASCADE,type text CHECK (type IN ('ppm','operating_agreement','subscription_agreement','accreditation_doc','government_id','signed_subscription','other')),storage_path text NOT NULL,file_name text NOT NULL,uploaded_by uuid references profiles(id),created_at timestamptz DEFAULT now()activity_log:id uuid PRIMARY KEY DEFAULT gen_random_uuid(),fund_id uuid references funds(id),investor_id uuid references investors(id),actor_id uuid references profiles(id),action text NOT NULL,metadata jsonb DEFAULT '{}',created_at timestamptz DEFAULT now()subscriptions (Stripe billing):id uuid PRIMARY KEY DEFAULT gen_random_uuid(),gp_id uuid NOT NULL references profiles(id),stripe_customer_id text NOT NULL UNIQUE,stripe_subscription_id text UNIQUE,plan text CHECK (plan IN ('starter','growth','pro','founding')),status text DEFAULT 'active',current_period_end timestamptz,created_at timestamptz DEFAULT now()ALSO GENERATE:- RLS policies for every table (GPs see only their own funds/investors)- updated_at triggers for all tables- Indexes on: investors(fund_id), investors(email), investors(status),funds(gp_id), funds(slug), activity_log(fund_id), activity_log(investor_id)- packages/db/src/types.ts (or supabase/types.ts) - generated TypeScript types matching this schema- packages/db/src/client.ts - typed Supabase client (browser + server variants)- packages/db/src/queries.ts - typed query functions for all common operationsVERIFY: RLS must block any GP from seeing another GP's data. Test with SQL.
S1-3	Privy Auth Integration & Protected Routes
CURSOR PROMPT - COPY EXACTLY
Implement complete authentication using Privy.io.CREATE:1. apps/web/src/app/layout.tsx - root layout wrapping app in PrivyProvider + QueryClientProviderPrivyProvider config:- loginMethods: ['email', 'wallet']- appearance: { theme: 'light', accentColor: '#1D4ED8', logo: '/logo.svg' }- embeddedWallets: { createOnLogin: 'off' }2. apps/web/src/lib/auth.ts - server-side auth helpers:- getServerSession(): gets current user from Privy JWT in server components- requireAuth(): throws redirect to /login if no session- requireRole(role): throws 403 if user role doesn't match- syncUserToSupabase(privyUser): upserts user into profiles table3. apps/web/src/app/(auth)/login/page.tsx - login page using Privy's useLogin hook- Clean, professional UI using shadcn Card component- After login: check if user has a profile in Supabase- If no profile: redirect to /onboarding/role-select- If GP profile: redirect to /dashboard- If LP profile: redirect to /investor/status4. apps/web/middleware.ts - Next.js middleware:- /dashboard/* routes require authenticated GP- /investor/* routes require authenticated LP- /api/* routes validate JWT (except /api/webhooks/*)- /apply/* routes are public (LP onboarding)5. apps/web/src/hooks/useAuth.ts - client-side auth hook:- Returns: { user, profile, isGP, isLP, isLoading, logout }VERIFY: Unauthenticated user hitting /dashboard redirects to /login.VERIFY: GP user cannot access /investor/* routes.
S1-4	GP Dashboard Shell & Fund Creation
CURSOR PROMPT - COPY EXACTLY
Build the GP dashboard shell and fund creation flow.1. apps/web/src/app/(dashboard)/layout.tsx - dashboard layout:- Sidebar with: Dashboard, Funds, Investors, Documents, Settings- Top bar with: user avatar, fund selector dropdown, notifications bell- Mobile: collapsible sidebar with hamburger- Active route highlighted in sidebar2. apps/web/src/app/(dashboard)/dashboard/page.tsx - dashboard home (server component):- Fetches: total investors by status, total funds, recent activity- Renders: StatsCard grid (4 cards), RecentActivity feed, QuickActions3. apps/web/src/components/dashboard/StatsCard.tsx - metric card:Props: { label, value, change, icon, color }Shows number, label, and % change vs last period4. apps/web/src/app/(dashboard)/funds/page.tsx - fund list:- Table of all GP's funds with: name, status badge, # investors, target raise- 'Create Fund' button top right- Empty state with illustration when no funds5. apps/web/src/app/(dashboard)/funds/new/page.tsx - fund creation wizard:5-step wizard using URL search params for step tracking (?step=1..5)Step 1: Basic info (name, type, target raise, min investment)Step 2: Compliance (jurisdiction, accreditation standard, KYC config)Step 3: Documents (upload PPM, Operating Agreement, Subscription template)Step 4: Branding (logo upload, accent color picker, custom domain field)Step 5: Review & Launch (summary of all steps, submit button)Each step validated with Zod before proceeding to next.Progress indicator shows completed/current/upcoming steps.Form state persisted in sessionStorage between steps.6. apps/web/src/app/api/funds/route.ts - POST /api/funds:- Validates request with Zod- Creates fund in Supabase- Generates unique slug from fund name- Logs to activity_log- Returns created fundVERIFY: Creating a fund redirects to /dashboard/funds/[id]VERIFY: Fund is visible in the funds list with correct status badgeVERIFY: Another GP cannot see this fund (RLS test)
SPRINT 2 · Weeks 3-4

Investor Invite System & LP Onboarding Flow

Invite links · LP portal · Steps 1-3 of application

By end of Sprint 2: GP can invite investors via a link. LP can complete steps 1-3 (account, personal info, accreditation doc upload). KYC not yet integrated.

S2-1	Investor Invite System
CURSOR PROMPT - COPY EXACTLY
Build the investor invite system. A GP copies a link and sends it to their investors.1. apps/web/src/app/api/funds/[fundId]/invite/route.ts - POST endpoint:- Accepts: { email: string } (or empty for generic link)- If email provided: creates investor record with status='invited', sends invite email- If no email: returns generic fund invite URL (/apply/[fund-slug])- Invite URL format: /apply/[fund-slug]?token=[signed-jwt-with-email]- JWT contains: { email, fundId, exp: 7 days }- Signed with INVITE_JWT_SECRET env var2. apps/web/src/components/dashboard/InviteInvestorModal.tsx:- shadcn Dialog component- Tab 1: 'Send via Email' - email input, sends invite email on submit- Tab 2: 'Copy Link' - shows generic fund link with copy button- Shows toast on success3. packages/email/src/InvestorInvite.tsx - React Email template:- Fund logo, fund name, GP name- CTA button: 'Start Your Application'- Clean professional design, mobile responsive- Footer: legal disclaimer about accredited investors only4. apps/web/src/app/api/send-invite/route.ts - POST endpoint using Resend:- Validates invite data- Renders InvestorInvite email template- Sends via Resend- Logs email_sent to activity_logVERIFY: Clicking invite link from email lands on correct fund's apply pageVERIFY: Expired token (>7 days) shows 'Link expired' pageVERIFY: Valid token pre-fills email in Step 1 of application
S2-2	LP Onboarding Portal - Step 1 & 2 (Account + Personal Info)
CURSOR PROMPT - COPY EXACTLY
Build the public investor onboarding portal. This is what investors see.1. apps/web/src/app/apply/[fundSlug]/layout.tsx - apply flow layout:- Shows fund logo + name in header (fetched by slug)- Clean, minimal - no dashboard sidebar- Progress bar at top showing current step (1-7)- Mobile-first design2. apps/web/src/app/apply/[fundSlug]/page.tsx - Welcome page:- Fund name, GP logo, 1-paragraph deal description- CTA: 'Begin Application'- Trust badges: 'KYC Secured by Persona', 'Documents via DocuSign','Blockchain-verified on Polygon'- '~15 minutes to complete' indicator3. apps/web/src/app/apply/[fundSlug]/step/[step]/page.tsx - dynamic step router4. Step 1 - Account Creation (/step/1):- Email (pre-filled if from invite token), password, confirm password- Phone (for 2FA)- Creates Privy account + Supabase profile with role='lp'- If email already has account: 'Continue with existing account' flow- Zod validation: email format, password min 8 chars, complexity rules5. Step 2 - Personal Information (/step/2):- Full legal name (first, middle optional, last)- Date of birth (date picker, must be 18+)- Residential address (street, city, state/province, country, zip)- Nationality (searchable select from country list)- SSN last 4 digits (conditional: only if US national)- All fields required except middle name and SSN- Zod schema with custom validators (DOB age check, SSN format)6. apps/web/src/hooks/useApplicationState.ts:- Persists step data in sessionStorage- Returns: { stepData, updateStep, clearApplication }- Used by all step components to read/write form stateVERIFY: Refreshing page mid-step doesn't lose form data (sessionStorage)VERIFY: Trying to access step 3 without completing steps 1-2 redirects to step 1
S2-3	Step 3 - Accreditation Verification
CURSOR PROMPT - COPY EXACTLY
Build Step 3 of the LP onboarding: accreditation method selection and doc upload. apps/web/src/app/apply/[fundSlug]/step/3/page.tsx:ACCREDITATION METHODS (show as selectable cards):Option A - Income Method:'I earned $200,000+ individually (or $300,000 with spouse) in eachof the last 2 years and expect the same this year'Required upload: last 2 years tax returns OR letter from CPA/attorneyOption B - Net Worth Method:'My net worth (excluding primary residence) exceeds $1,000,000'Required upload: bank/brokerage statements OR letter from CPA/attorneyOption C - Professional Certification:'I hold Series 7, Series 65, or Series 82 license'Required input: license number + license type selectOption D - Entity Method:'I am investing on behalf of an entity with $5M+ in investments'Required upload: entity formation docs + financial statementsIMPLEMENTATION DETAILS:- When method selected, show relevant upload area and instructions- Upload component: drag-and-drop + click to upload- Accepted formats: PDF, JPG, PNG (max 10MB per file)- Upload goes to Supabase Storage at:/private/[investorId]/accreditation/[timestamp]-[filename]- Supabase RLS: only the investor and the GP can read this path- Show upload progress bar- Show thumbnail/filename after successful upload- Allow re-upload (replaces existing)- Save accreditation_type and accreditation_doc_path to investors tableVERIFY: Uploaded file is NOT publicly accessible via direct Supabase URLVERIFY: GP dashboard shows accreditation type for each investor after step 3
SPRINT 3 · Weeks 5-6

Persona KYC Integration (End-to-End)

Persona SDK · Webhook handler · Real-time status · GP review queue

This is the most technically complex sprint. Persona integration requires getting the embed, webhook, and database sync all working together. Allocate extra testing time.

IMPORTANT: Before writing any Persona code, read docs.withpersona.com/reference/introduction. The prompt below assumes you have a Persona account and have created a 'Government ID + Selfie' inquiry template.
S3-1	Persona SDK Embed - Step 4 of LP Flow
CURSOR PROMPT - COPY EXACTLY
Implement Persona KYC as Step 4 of the LP onboarding flow. apps/web/src/app/apply/[fundSlug]/step/4/page.tsx:1. apps/web/src/lib/persona/client.ts - Persona API client:- createInquiry(investorId, email): creates inquiry via Persona API,returns { inquiryId, sessionToken }- getInquiry(inquiryId): fetches full inquiry object- resumeInquiry(inquiryId): gets fresh session token for resuming2. apps/web/src/app/api/kyc/create-inquiry/route.ts - POST endpoint:- Requires authenticated LP session- Checks if investor already has a kyc_inquiry_id (allow resume)- If new: calls persona.createInquiry(), saves inquiryId to investors table- If existing incomplete: calls persona.resumeInquiry()- Returns: { sessionToken, inquiryId }3. apps/web/src/components/kyc/PersonaEmbed.tsx - client component:- Loads Persona.js from CDN dynamically (not installed as npm package)- Initializes with sessionToken from API- Handles Persona events:onReady: show embed, hide loading spinneronComplete: update investor status to 'kyc_pending', move to step 5onError: show error message with retry buttononCancel: show 'come back anytime' message with resume button- Mobile-responsive container (Persona embed is responsive by default)4. Step 4 page structure:- Heading: 'Verify Your Identity'- Subtext: 'This takes about 3 minutes. Have your government-issued ID ready.'- PersonaEmbed component- Privacy note: 'Your ID is verified by Persona and never stored by [Fund Name]'CRITICAL: The sessionToken must be fetched server-side and passed as prop.CRITICAL: Never expose Persona API key to the browser.CRITICAL: Set referenceId on inquiry = investorId for webhook correlation.VERIFY: Completing KYC flow shows success state and proceeds to step 5VERIFY: Closing browser mid-KYC and returning resumes the same inquiry
S3-2	Persona Webhook Handler
CURSOR PROMPT - COPY EXACTLY
Build the Persona webhook handler in the separate webhook service. apps/webhooks/src/routes/persona.ts:WEBHOOK EVENTS TO HANDLE:inquiry.completed - KYC verification finished (may be approved or declined)inquiry.approved - KYC passed, identity verifiedinquiry.declined - KYC failed, need to show reason to LPinquiry.expired - Inquiry timed outinquiry.failed - Technical failureIMPLEMENTATION:1. HMAC verification (first thing, before any processing):- Read raw body (do NOT parse JSON before verifying)- Compute: HMAC-SHA256(rawBody, PERSONA_WEBHOOK_SECRET)- Compare with Persona-Signature header (timing-safe comparison)- Return 401 if mismatch2. Extract from payload:- inquiryId: data.attributes['inquiry-id'] or data.id- referenceId: data.attributes['reference-id'] // this is our investorId- status: data.attributes.status- declinedReasons: data.attributes['declined-reason-codes'] (array)3. For inquiry.approved:- Update investors table:kyc_status = 'approved',kyc_completed_at = NOW(),kyc_result = full webhook payload,status = 'accreditation_pending' (if accreditation doc exists)OR status = 'kyc_pending' (waiting for GP review)- Send KYC_APPROVED email to GP via Resend- Log to activity_log4. For inquiry.declined:- Update investors: kyc_status='failed', kyc_result=payload- Map Persona decline codes to human-readable reasons- Send rejection email to LP with specific reason + resubmission link- Send notification to GP5. Return 200 immediately after DB update (Persona retries on non-200)6. packages/email/src/KycApproved.tsx - email to GP: '[Name] completed KYC - ready for review'7. packages/email/src/KycRejected.tsx - email to LP: reason + link to resubmitVERIFY: Test with Persona's webhook tester using a real inquiry IDVERIFY: DB updates happen correctly for approved + declined eventsVERIFY: Non-HMAC request returns 401
S3-3	GP KYC Review Queue & Real-Time Status
CURSOR PROMPT - COPY EXACTLY
Build the GP-facing KYC review queue and real-time investor status updates.1. apps/web/src/app/(dashboard)/investors/page.tsx - investor table (server component):- Full sortable, filterable table using shadcn Table component- Columns: Name, Email, KYC Status, Accreditation, Amount, Wallet, Joined- KYC Status shown as colored badge:not_started=gray, pending=yellow, approved=green, failed=red- Filter bar: filter by KYC status, accreditation status, date range- Search by name or email- Pagination (25 per page)- Export CSV button (generates download of visible rows)2. apps/web/src/app/(dashboard)/investors/kyc-queue/page.tsx - KYC review queue:- Shows only investors with kyc_status='approved' awaiting GP review- Sorted by kyc_completed_at ASC (oldest first)- Each row: investor name, KYC completion time, quick approve/reject buttons- Click investor: expands to show KYC summary (name, DOB, nationality from Persona)- Approve button: sets investor status='approved', triggers whitelist flow- Reject button: opens modal with rejection reason select + custom notes,sends rejection email to LP3. apps/web/src/app/api/investors/[investorId]/approve/route.ts - POST:- Requires GP auth + fund ownership check- Updates investor: status='approved'- Triggers whitelist job (sends to blockchain queue - see Sprint 5)- Sends approval email to LP- Logs to activity_log4. Real-time status in LP portal using Supabase Realtime: apps/web/src/hooks/useInvestorStatus.ts:- Subscribes to investors table row changes for current investor- Updates status page in real-time without refresh- Shows 'Your application is being reviewed...' with live status dotVERIFY: When GP approves in queue, LP status page updates within 3 secondsVERIFY: GP cannot approve investors from another GP's fund
SPRINT 4 · Weeks 7-8

DocuSign E-Signature, Wallet Connect & Full LP Flow

DocuSign embedded · Privy wallet · Application submission

By end of Sprint 4: The complete LP application flow works end-to-end. Investor can go from invite link to submitted application in one session.

S4-1	DocuSign Embedded Signing - Step 5
CURSOR PROMPT - COPY EXACTLY
Implement DocuSign embedded signing for subscription agreement. Step 5 of LP flow.1. apps/web/src/lib/docusign/client.ts - DocuSign SDK wrapper:- authenticate(): gets access token via JWT Grant (server-to-server)- createEnvelope(investorId, fundId, investorData):- Fetches subscription agreement template from Supabase Storage- Creates envelope with investor as signer- Pre-fills merge fields: investorName, investorEmail, fundName,investmentAmount, date- Returns envelopeId- createEmbeddedSigningUrl(envelopeId, signerEmail, returnUrl):- Creates recipient view for embedded signing- Returns signingUrl (valid for 5 minutes)- getEnvelopeStatus(envelopeId): returns current signing status2. apps/web/src/app/api/docusign/create-session/route.ts - POST:- Requires authenticated LP- Creates or resumes DocuSign envelope for this investor- Returns signingUrl3. apps/web/src/app/apply/[fundSlug]/step/5/page.tsx:- Fetches signingUrl from API on mount- Embeds DocuSign iframe (full width, 600px height on desktop, full screen mobile)- DocuSign return URL: /apply/[slug]/step/5/complete?event=[event]- Handles return events: signing_complete, cancel, decline, session_timeout4. apps/web/src/app/apply/[fundSlug]/step/5/complete/page.tsx:- On signing_complete: update investor doc_signed_at, status='docs_pending'then redirect to step 6- On cancel: show 'Resume later' page with link to return- On decline: show explanation + contact GP option5. DocuSign webhook at apps/webhooks/src/routes/docusign.ts:- HMAC verify (same pattern as Persona webhook)- On envelope-completed: download signed PDF, store to Supabase Storage,create documents table record, update investorVERIFY: Signed PDF appears in GP document vault after signingVERIFY: Investor status updates to 'docs_pending' after signature
S4-2	Wallet Connect - Step 6
CURSOR PROMPT - COPY EXACTLY
Build Step 6: wallet address collection for on-chain whitelisting. apps/web/src/app/apply/[fundSlug]/step/6/page.tsx:THREE OPTIONS - shown as cards:Option 1: Connect Existing Wallet (MetaMask / WalletConnect)- wagmi ConnectButton styled to match app design- When connected: show truncated address + ENS name if available- 'Use this wallet' confirmation buttonOption 2: Create New Wallet (Privy Embedded Wallet)- 'Don't have a wallet? We'll create one for you'- Uses Privy createWallet() - creates embedded wallet tied to email- Shows created wallet address- Explain: 'Your wallet is secured by your email. No seed phrase needed.'Option 3: Enter Address Manually- Text input for wallet address- Validates: is valid Ethereum address (ethers.isAddress)- Warning: 'Make sure you control this wallet. Tokens sent here are non-recoverable.'AFTER WALLET SELECTED:- Check if address is already whitelisted (read contract)- If already whitelisted: show info message 'This address is already in our system'- Save wallet_address to investors table- Move to step 7VERIFY: MetaMask connection works and saves correct checksummed addressVERIFY: Manual address entry rejects invalid Ethereum addresses
S4-3	Application Review & Submission - Step 7
CURSOR PROMPT - COPY EXACTLY
Build the final review step and investor status page.1. apps/web/src/app/apply/[fundSlug]/step/7/page.tsx - Review & Submit:- Summary of all steps in clean card layout:Personal Info: name, email, nationalityAccreditation: type selected, doc uploaded (show filename)KYC: 'Verified by Persona' with green checkmarkAgreement: 'Signed [date]' with download linkWallet: truncated address with Polygon logo- Investment amount input (if not pre-set by fund):min/max from fund config, formatted as currency- Legal acknowledgment checkbox (required):'I confirm all information provided is accurate and I am anaccredited investor under applicable securities laws.'- 'Submit Application' button (disabled until checkbox checked)2. apps/web/src/app/api/investors/[investorId]/submit/route.ts - POST:- Validates all required steps are complete- Updates investor: status='kyc_pending' (or 'approved' if auto-approve on)- Updates subscription_amount_cents- Sends confirmation emails to both GP and LP- Logs to activity_log- Returns success3. apps/web/src/app/apply/[fundSlug]/success/page.tsx - Post-submission page:- 'Application Submitted!' confirmation- Link to investor status page: /investor/[investorId]/status- 'What happens next' timeline (3 steps: GP review, approval, funding)4. apps/web/src/app/investor/[investorId]/status/page.tsx - LP status page (auth required):- Progress tracker: 7 stages from 'Applied' to 'Funded'- Current stage highlighted with animated pulse- Documents section: download signed subscription agreement- Supabase Realtime subscription to update status livepackages/email/src/ApplicationReceived.tsx - confirmation email to LP. packages/email/src/NewApplication.tsx - notification email to GPVERIFY: Complete full flow from invite link to submission in one browser sessionVERIFY: GP sees new investor in dashboard after LP submits
SPRINT 5 · Weeks 9-10

ERC-3643 Smart Contracts & On-Chain Whitelisting

T-REX protocol · Contract deploy · Auto-whitelist on KYC approval

This sprint bridges your off-chain compliance data to the blockchain. When a GP approves an investor, their wallet is automatically added to the token's transfer whitelist.

Before starting this sprint, read: github.com/TokenySolutions/T-REX. Clone their repository and understand the IdentityRegistry and Compliance contracts. Use their deployed factory contracts on Polygon - do NOT write your own token contract from scratch.
S5-1	Hardhat Project Setup & Contract Configuration
CURSOR PROMPT - COPY EXACTLY
Set up the Hardhat development environment for ERC-3643 contracts. Use apps/blockchain (per monorepo structure). Use current stable versions only (Hardhat 3 is alpha—use Hardhat 2 for production).1. apps/blockchain/package.json:Dependencies: hardhat@^2.28.0, @nomicfoundation/hardhat-toolbox@hh2 (Hardhat 2–compatible toolbox), @openzeppelin/contracts@^5.6.0, ethers@^6.16.0, dotenv@^16.4.0.2. apps/blockchain/hardhat.config.ts:- Networks: hardhat (local), polygon_amoy (testnet), polygon (mainnet)- Use POLYGON_RPC_URL and DEPLOYER_PRIVATE_KEY from .env- Etherscan config for Polygon verification3. apps/blockchain/contracts/FundToken.sol:DO NOT write a full ERC-3643 from scratch.Instead, create a minimal interface contract that:- Inherits from OpenZeppelin ERC20- Has an IdentityRegistry mapping (address => bool isWhitelisted)- Has addToWhitelist(address) onlyOwner- Has removeFromWhitelist(address) onlyOwner- Overrides transfer() and transferFrom() to revert if !isWhitelisted[from]and !isWhitelisted[to]- Has isWhitelisted(address) public view returns (bool)NOTE: This is a simplified compliance token for Phase 1.Full ERC-3643 T-REX integration is a Phase 2 upgrade.4. apps/blockchain/contracts/FundFactory.sol:- deployFund(name, symbol, initialOwner) - deploys FundToken- emits FundDeployed(address tokenAddress, string name, address owner)- Stores deployed token addresses5. apps/blockchain/scripts/deploy-factory.ts:- Deploys FundFactory to configured network- Saves deployed address to apps/blockchain/deployments/[network].json6. apps/blockchain/test/FundToken.test.ts:- Test: deploy token, add address to whitelist, transfer succeeds- Test: transfer from non-whitelisted address reverts- Test: removeFromWhitelist prevents future transfersVERIFY: npx hardhat test passes all testsVERIFY: Deploy to Polygon Amoy testnet, verify on Polygonscan
S5-2	Blockchain Service Layer & Auto-Whitelist
CURSOR PROMPT - COPY EXACTLY
Build the server-side blockchain service that handles all on-chain operations.1. apps/web/src/lib/blockchain/client.ts:- Initializes ethers.js provider (Polygon RPC)- Initializes deployer wallet from DEPLOYER_WALLET_PRIVATE_KEY- getFundTokenContract(contractAddress): returns typed contract instance- getFundFactoryContract(): returns factory contract instance2. apps/web/src/lib/blockchain/fundService.ts:deployFundToken(fundId, name, symbol):- Calls FundFactory.deployFund(name, symbol, deployerAddress)- Waits for 2 confirmations- Updates funds table: token_config.contract_addr, token_config.chain_id=137- Returns: { contractAddress, txHash }addToWhitelist(contractAddress, walletAddress, investorId):- Calls FundToken.addToWhitelist(walletAddress)- Waits for 1 confirmation- Updates investors: is_whitelisted=true, whitelist_tx_hash=txHash- Logs to activity_log with txHash- Sends 'You are now whitelisted' email to investor- Returns: { txHash, blockNumber }removeFromWhitelist(contractAddress, walletAddress):- Calls FundToken.removeFromWhitelist(walletAddress)- Waits for 1 confirmation- Updates investors: is_whitelisted=false- Returns: { txHash }getWhitelistStatus(contractAddress, walletAddress):- Calls FundToken.isWhitelisted(walletAddress)- Returns boolean (read-only, no gas)3. apps/web/src/app/api/investors/[investorId]/whitelist/route.ts - POST (GP only):- Verify GP owns the fund- Verify investor is approved and has wallet_address- Verify fund has contract_addr in token_config- Call fundService.addToWhitelist()- Return { txHash, polygonscanUrl }4. Error handling for blockchain calls:- Insufficient gas: retry with higher gas estimate- Network timeout: retry up to 3 times with exponential backoff- Revert: parse revert reason and return human-readable error- All errors logged to Sentry with full contextVERIFY: GP approves investor -> wallet automatically whitelisted on PolygonVERIFY: Polygonscan shows transaction from deployer walletVERIFY: getWhitelistStatus returns true for whitelisted investor
SPRINT 6 · Weeks 11-12

Stripe Billing, Polish & Production Deploy

Stripe subscriptions · Email flows · Error handling · Mainnet

Final sprint. By end of week 12: platform is live on Polygon mainnet, billing is running, and your first founding customer is onboarded.

S6-1	Stripe Billing Integration
CURSOR PROMPT - COPY EXACTLY
Implement Stripe Billing for the 3-tier SaaS subscription model.PRICING PLANS (create in Stripe Dashboard first, then use Price IDs here):Starter: $499/mo - 1 fund, 25 investors maxGrowth: $1499/mo - 3 funds, 100 investors maxPro: $3499/mo - unlimited funds, unlimited investorsFounding: custom - 50% off Pro, assigned manually1. apps/web/src/lib/stripe/client.ts:- Stripe server client (singleton)- createCustomer(gpId, email, name): creates Stripe customer, saves to subscriptions table- createCheckoutSession(customerId, priceId, fundId): creates Stripe checkout session- getSubscription(subscriptionId): returns subscription with plan limits- cancelSubscription(subscriptionId)- getPlanLimits(plan): returns { maxFunds, maxInvestors }2. apps/web/src/app/api/billing/checkout/route.ts - POST:- Creates or retrieves Stripe customer for GP- Creates checkout session with success_url + cancel_url- Returns { checkoutUrl }3. apps/webhooks/src/routes/stripe.ts - Stripe webhook handler:- HMAC verify with stripe.webhooks.constructEvent(rawBody, sig, secret)- Handle: checkout.session.completed-> create/update subscriptions table-> send welcome email to GP- Handle: customer.subscription.deleted-> update status='canceled'-> send cancellation email- Handle: invoice.payment_failed-> send payment failure email-> after 3 failures, restrict dashboard access4. apps/web/src/lib/stripe/limits.ts - plan enforcement middleware:- checkFundLimit(gpId): throws 403 if GP has reached fund limit for plan- checkInvestorLimit(fundId): throws 403 if fund has reached investor limit- Used in API routes for fund creation and investor invite5. apps/web/src/app/(dashboard)/settings/billing/page.tsx:- Shows current plan, billing period, next charge date- Upgrade/downgrade buttons (redirect to Stripe Customer Portal)- Invoice history- Cancel subscription (with confirmation modal)VERIFY: Completing checkout upgrades GP plan in DBVERIFY: Starter GP cannot create more than 1 fund (gets upgrade prompt)
S6-2	Complete Email Notification System
CURSOR PROMPT - COPY EXACTLY
Build all remaining email templates and notification triggers.All emails use Resend + React Email templates.EMAILS TO BUILD (each as a React Email template + send function):GP EMAILS:gp-welcome.tsx - After signup: 'Welcome to [Platform]'investor-applied.tsx - When LP submits applicationkyc-ready-for-review.tsx - When Persona approves, awaiting GP reviewinvestor-whitelisted.tsx - Confirmation when on-chain whitelist succeedsdaily-digest.tsx - Daily: pending KYC count, new investors todayLP EMAILS:lp-invite.tsx - Invite to join fund (already built in S2, review)lp-application-received.tsx - 'We got your application'lp-kyc-approved.tsx - KYC passed, awaiting GP approvallp-kyc-rejected.tsx - KYC failed, with specific reason + retry linklp-approved.tsx - GP approved, 'You're in!'lp-whitelisted.tsx - On-chain whitelist confirmed + Polygonscan linklp-rejected.tsx - GP rejected, with reason if providedIMPLEMENTATION REQUIREMENTS:- All templates: mobile responsive, max-width 600px- Brand colors pulled from fund.branding.accent_color- Fund logo shown in header (fallback to platform logo if none)- Footer: unsubscribe link (transactional emails exempt in US but best practice)- Plain text fallback version for all templates- Preview text (shows in email client preview)- Subject lines with personalization tokenspackages/email/src/send.ts (or apps/web/src/lib/email/send.ts using packages/email) - unified email sender:sendEmail({ template, to, subject, data })- Renders template with data- Sends via Resend- Logs send attempt + message ID to DB- Returns { success, messageId, error? }VERIFY: All 12 email templates render correctly in resend.com email previewVERIFY: No broken images or layout issues on mobile (test with responsive preview)
S6-3	Error Handling, Loading States & Production Polish
CURSOR PROMPT - COPY EXACTLY
Add production-grade error handling, loading states, and UX polish.1. apps/web/src/components/ui/ErrorBoundary.tsx:- React Error Boundary for the entire app- Shows user-friendly error page (not stack trace)- Reports to Sentry automatically- 'Reload page' and 'Go to dashboard' buttons2. Global error states for all async operations:- Every API call wrapped in try/catch with toast notification on error- Toast: shadcn Sonner component (already in shadcn)- Error messages: user-friendly (not 'Error 500'), specific to action- Network errors: show 'Check your connection' with retry button3. Loading states for all data fetches:- Skeleton loaders for tables (InvestorTableSkeleton, FundCardSkeleton)- Button loading states: spinner + disabled during async ops- Page transitions: route change loading indicator (NProgress style)4. Empty states for all lists:- No funds: illustration + 'Create your first fund' CTA- No investors: illustration + 'Invite your first investor' CTA- No KYC queue: 'All caught up!' message5. Form validation UX:- Inline error messages below each field (not just on submit)- Success state: green border + checkmark on valid field- Multi-step form: show step-level error summary if any field invalid6. apps/web/src/app/not-found.tsx - custom 404 page7. apps/web/src/app/error.tsx - custom error page8. apps/web/src/app/loading.tsx - global loading stateVERIFY: Disconnect network during API call - shows toast, not blank screenVERIFY: All forms show inline errors on invalid submitVERIFY: Sentry receives test error from ErrorBoundary
S6-4	Security Audit & Production Deployment
CURSOR PROMPT - COPY EXACTLY
Run a production readiness check and deploy to Vercel + Railway.SECURITY CHECKLIST - verify each item, fix any that fail:1. RLS AUDIT:Write Supabase SQL queries to verify:- SELECT * FROM funds returns 0 rows for anon role- SELECT * FROM investors returns 0 rows for anon role- GP A cannot see GP B's funds (test with two service role clients)- LP can only see their own investor record2. API ROUTE AUDIT:Verify all /api/* routes (except /api/webhooks/*) require auth.Generate a list of all API routes and their auth requirements.Flag any route missing authentication.3. WEBHOOK SECURITY:Verify HMAC verification is the FIRST thing in each webhook handler.No DB operations should happen before HMAC check.4. ENV VAR AUDIT:Run: grep -r 'process.env' in apps/web, apps/webhooks, and packages; verify every access goes through packages/config or app config that uses it. Verify no secrets are in NEXT_PUBLIC_* variables.5. DEPENDENCY AUDIT:Run: npm audit and fix any high/critical vulnerabilitiesDEPLOYMENT STEPS:6. Vercel deployment (for apps/web):- Set root directory to apps/web (or use monorepo preset). vercel.json with env vars listed (values in Vercel dashboard).- Build command: pnpm build (from repo root with filter) or npm run build from apps/web.- Framework preset: Next.js7. Railway deployment for webhook service:- apps/webhooks/railway.json config- Dockerfile for the Express webhook service- Health check endpoint at /health8. Polygon mainnet deployment:- Update .env: POLYGON_NETWORK=polygon (not amoy)- Deploy FundFactory to mainnet with verification- Update NEXT_PUBLIC_FACTORY_ADDRESS in Vercel env vars9. Monitoring setup:- Sentry DSN configured in Vercel env vars- Sentry source maps uploaded during build- Set up Sentry alert for error spike > 5 errors/minuteOUTPUT: Deployment checklist with green/red status for each item.VERIFY: Full end-to-end flow works on production URL (not localhost)
Bonus: Correction & Debug Prompts

Use these when Cursor produces output that doesn't match your standards.

When Cursor uses 'any' types:

CURSOR PROMPT - COPY EXACTLY
The code you generated uses TypeScript 'any' types in [filename].Replace ALL instances of 'any' with proper typed interfaces.For Supabase query results, use the generated types from packages/db (e.g. packages/db/src/types.ts).For unknown webhook payloads, use 'unknown' and add runtime type guards.Do not use type assertions (as X) without a type guard function.
When Cursor ignores RLS and uses service role client:

CURSOR PROMPT - COPY EXACTLY
This API route uses the service role Supabase client for a GP data query.This bypasses RLS and is a security vulnerability.Rewrite using the authenticated user's session client so RLS applies.The user's JWT should be passed to supabase.auth.setSession() before querying.Only use service role client for: webhook handlers, background jobs, admin ops.
When Cursor uses useEffect for data fetching:

CURSOR PROMPT - COPY EXACTLY
This component uses useEffect + useState for data fetching.Replace with React Query's useQuery hook:const { data, isLoading, error } = useQuery({queryKey: ['resource', id],queryFn: () => fetchResource(id),})If this is a server component, convert to async server component instead.useEffect should only be used for: subscriptions, DOM side effects, timers.
When blockchain calls are made client-side:

CURSOR PROMPT - COPY EXACTLY
This code makes a contract write call (sendTransaction / contract.method())directly from a client component using the user's wallet.For this platform, ALL write operations (whitelist, deploy) must be server-sideusing the deployer wallet, not the user's wallet.Move this logic to an API route that:1. Verifies the requesting user has permission2. Uses the deployer wallet from apps/web/src/lib/blockchain/client.ts (or packages used by API)3. Returns { txHash } to the clientThe client should only do: read calls (isWhitelisted) and display tx hashes.
When Cursor truncates long files with '...':

CURSOR PROMPT - COPY EXACTLY
Your response was truncated. Continue generating from where you stopped.Start from: [paste the last complete line from the truncated output]Do not repeat what was already generated.Complete the file fully - no ellipsis, no 'add rest of code here' comments.The file path is: [path]
47 prompts. 6 sprints. 12 weeks. 1 platform.

Every prompt is engineered. Every decision is made.

Paste the Master Context first. Run prompts in order. Ship.