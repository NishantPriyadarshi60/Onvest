# Testing Status

Last updated: March 2026

---

## S5-1 (Hardhat Project Setup & ERC-3643 Contracts)

**Prerequisites:** None for local tests. For Polygon Amoy deploy/verify: `POLYGON_AMOY_RPC_URL` (or `POLYGON_RPC_URL`), `DEPLOYER_PRIVATE_KEY`, `POLYGONSCAN_API_KEY` in `apps/blockchain/.env`.

| Check | Status | Notes |
|-------|--------|-------|
| `npx hardhat compile` succeeds | ✅ **Verified** | Compiles 8 Solidity files (FundToken, FundFactory + OpenZeppelin). |
| `npx hardhat test` — all 3 tests pass | ✅ **Verified** | FundToken: deploy + whitelist + transfer, non-whitelisted reverts, removeFromWhitelist prevents transfers. |
| Deploy FundFactory locally | ✅ **Verified** | `npx hardhat run scripts/deploy-factory.ts --network hardhat` writes to `deployments/hardhat.json`. |
| Deploy FundFactory to Polygon Amoy | ⏳ **Manual** | `npx hardhat run scripts/deploy-factory.ts --network polygon_amoy`. Requires env vars. |
| Verify on Polygonscan | ⏳ **Manual** | `npx hardhat verify --network polygon_amoy <FUND_FACTORY_ADDRESS>`. Requires `POLYGONSCAN_API_KEY`. |
| FundToken: addToWhitelist(addr) onlyOwner | ⏳ **Covered by tests** | Tests add and remove. |
| FundToken: transfer/transferFrom revert if from or to not whitelisted | ⏳ **Covered by tests** | Test "transfer to non-whitelisted address reverts". |
| FundToken: isWhitelisted(address) returns bool | ⏳ **Covered by tests** | Used implicitly in transfer tests. |
| FundFactory: deployFund emits FundDeployed | ⏳ **Not explicitly tested** | Factory deploys token; event present in contract. |
| FundFactory: stores deployed token addresses | ⏳ **Not explicitly tested** | `deployedFunds` mapping; verified by deployment script. |

### Quick Reference – How to Test S5-1

1. **Unit tests**
   ```bash
   cd apps/blockchain && npx hardhat test
   ```
   Expect: 3 passing tests.

2. **Local deploy**
   ```bash
   cd apps/blockchain && npx hardhat run scripts/deploy-factory.ts --network hardhat
   ```
   Expect: `FundFactory deployed to: 0x...` and `deployments/hardhat.json` written.

3. **Polygon Amoy deploy**
   - Add to `apps/blockchain/.env`:
     ```
     POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
     DEPLOYER_PRIVATE_KEY=0x...
     POLYGONSCAN_API_KEY=...
     ```
   - Run:
     ```bash
     npx hardhat run scripts/deploy-factory.ts --network polygon_amoy
     ```

4. **Verify on Polygonscan**
   ```bash
   npx hardhat verify --network polygon_amoy <FUND_FACTORY_ADDRESS>
   ```

---

## S5-2 (Blockchain Service & Auto-Whitelist)

**Prerequisites:** `DEPLOYER_WALLET_PRIVATE_KEY`, `FACTORY_CONTRACT_ADDRESS`, `POLYGON_RPC_URL` or `NEXT_PUBLIC_POLYGON_RPC`. Fund must have `token_config.contract_addr` (deploy via `fundService.deployFundToken` or script).

| Check | Status | Notes |
|-------|--------|-------|
| GP approves investor → wallet auto-whitelisted | ⏳ **Manual** | Approve in KYC queue when investor has wallet_address and fund has contract_addr. |
| Polygonscan shows tx from deployer wallet | ⏳ **Manual** | Verify tx hash on Polygonscan. |
| getWhitelistStatus returns true for whitelisted address | ⏳ **Manual** | save-wallet or whitelist API; used in Step 6. |
| POST /api/investors/[id]/whitelist → { txHash, polygonscanUrl } | ⏳ **Manual** | Manual whitelist; GP only. |
| Already whitelisted → alreadyWhitelisted: true, no duplicate tx | ⏳ **Manual** | Idempotent. |
| InvestorWhitelisted email sent | ⏳ **Manual** | LP receives "You are now whitelisted" + Polygonscan link. |
| activity_log whitelist_added entry | ⏳ **Manual** | After whitelist. |
| Fund without contract_addr → 400 | ⏳ **Manual** | "Fund does not have a deployed token contract". |
| Investor not approved → 400 | ⏳ **Manual** | "Investor must be approved before whitelisting". |

### Quick Reference – How to Test S5-2

1. Set env: `DEPLOYER_WALLET_PRIVATE_KEY`, `FACTORY_CONTRACT_ADDRESS`, `POLYGON_RPC_URL` (or `NEXT_PUBLIC_POLYGON_RPC`).
2. Deploy FundToken for a fund (via `fundService.deployFundToken` or script), update `funds.token_config.contract_addr`.
3. **Auto-whitelist:** GP approves investor with wallet_address → wallet whitelisted, InvestorWhitelisted email sent.
4. **Manual whitelist:** POST `/api/investors/[id]/whitelist` (GP auth) → returns `{ txHash, polygonscanUrl }`.
5. **Step 6:** If address already whitelisted, save-wallet returns `alreadyWhitelisted: true`.

---

## S6-1 (Stripe Billing Integration)

**Prerequisites:** Create products/prices in Stripe Dashboard. Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_GROWTH`, `STRIPE_PRICE_PRO` in env. Point Stripe webhook to `https://your-webhooks-host/stripe`.

| Check | Status | Notes |
|-------|--------|-------|
| Checkout → plan in DB | ⏳ **Manual** | Complete Stripe Checkout; webhook updates subscriptions. |
| Starter GP at 1 fund → upgrade prompt | ⏳ **Manual** | 2nd fund creation returns 403 + upgradeRequired. |
| Investor limit enforced on invite | ⏳ **Manual** | At plan limit, invite returns 403. |
| Billing page + Manage portal | ⏳ **Manual** | /dashboard/settings/billing. |
| Webhook: GpWelcome, cancellation, payment failed emails | ⏳ **Manual** | checkout.session.completed, subscription.deleted, invoice.payment_failed. |
| No subscription → create fund blocked | ⏳ **Manual** | "Subscribe at Settings → Billing". |

### Quick Reference – How to Test S6-1

1. Create Stripe products/prices. Set STRIPE_PRICE_* in env.
2. **Settings → Billing** → Subscribe → complete checkout.
3. Create 1 fund (Starter) → OK. Create 2nd → 403.
4. **Manage subscription** → Stripe portal.
5. Stripe CLI: `stripe listen --forward-to localhost:3030/stripe` for webhook testing.

---

## S6-2 (Email Templates & Notification Triggers)

**Prerequisites:** `RESEND_API_KEY`. All templates use React Email + Resend; max-width 560px, mobile responsive.

| Template | Trigger | Notes |
|----------|---------|-------|
| GpWelcomeSignup | After GP signup | Welcome to [Platform]. Wire in auth/onboarding when GP profile created. |
| NewApplication (investor-applied) | LP submits application | To GP. Already sent from submit route. |
| KycApproved (kyc-ready-for-review) | Persona approves | To GP. From Persona webhook. |
| InvestorWhitelistedGp | On-chain whitelist succeeds | To GP. Sent with InvestorWhitelisted (to LP) from addToWhitelist. |
| DailyDigest | Daily cron | To GP: pending KYC count, new investors. Wire via cron job; optional unsubscribeUrl. |
| InvestorInvite (lp-invite) | Invite sent | Already built. |
| ApplicationReceived (lp-application-received) | LP submits | Already sent from submit route. |
| LpKycApproved | Persona approves | To LP: KYC passed, awaiting GP. Sent from Persona webhook. |
| KycRejected (lp-kyc-rejected) | Persona declines | To LP. From Persona webhook. |
| InvestorApproved (lp-approved) | GP approves | To LP. From approve route. |
| InvestorWhitelisted (lp-whitelisted) | Whitelist succeeds | To LP. From addToWhitelist. |
| LpRejected | GP rejects | To LP. From reject route (uses LpRejected template). |

### Quick Reference – S6-2

- **Send helper:** `sendEmail({ to, subject, react })` returns `{ success, messageId, error: null }` or throws.
- **Subject lines:** Use personalization (e.g. `Subject: Application update for ${fund.name}`).
- **Preview text:** Set `<Preview>` in each template for email client preview.

### What to Test – S6-2

| Verify | How |
|--------|-----|
| All 12 templates render in Resend preview | Use Resend dashboard or `react-email dev` to preview each template with sample data. |
| No broken images or layout on mobile | Test at 375px width; templates use max-width 560px. |
| LP submits → GP gets NewApplication, LP gets ApplicationReceived | Run full apply flow → submit; check both inboxes. |
| Persona approves → GP gets KycApproved, LP gets LpKycApproved | Complete KYC in Persona sandbox; check both. |
| Persona declines → LP gets KycRejected (reason + retry link) | Trigger decline in Persona; check LP email. |
| GP approves → LP gets InvestorApproved | Approve from KYC queue; check LP. |
| Whitelist succeeds → LP gets InvestorWhitelisted, GP gets InvestorWhitelistedGp | Add to whitelist; check both. |
| GP rejects → LP gets LpRejected (reason) | Reject from dashboard; check LP. |
| GpWelcomeSignup | Trigger on GP signup (wire in auth flow). |
| DailyDigest | Trigger via cron with pendingKycCount, newInvestorsToday. |

---

## S3-1 (Persona KYC – Step 4)

**Prerequisites:** Add `PERSONA_API_KEY` and `PERSONA_INQUIRY_TEMPLATE_ID` to `.env.local` from [dashboard.withpersona.com](https://dashboard.withpersona.com). Create a "Government ID + Selfie" inquiry template.

| Check | Status | Notes |
|-------|--------|-------|
| Step 4 loads after completing Steps 1–3 | ⏳ **Not tested** | Navigate to `/apply/[fund-slug]/step/4` after finishing accreditation. Should show "Verify Your Identity". |
| Create inquiry: new investor gets session token, `kyc_inquiry_id` saved | ⏳ **Not tested** | First visit to Step 4 calls create-inquiry API; check DB that `investors.kyc_inquiry_id` is set. |
| Persona embed loads (script from CDN), spinner hides on ready | ⏳ **Not tested** | Persona modal/overlay appears; loading spinner disappears. |
| **Completing KYC flow** → success state, status = kyc_pending, redirect to step 5 | ⏳ **Not tested** | Finish Persona flow → "Identity verification complete" → redirect to Step 5. Verify `investors.status` = `kyc_pending`. |
| **Closing browser mid-KYC and returning** → same inquiry resumes | ⏳ **Not tested** | Start KYC, close tab. Reopen same apply link, go to Step 4. Should resume same inquiry, not create a new one. |
| onError → error message + Retry button | ⏳ **Not tested** | Simulate error (e.g. invalid token, network fail); should show error UI with Retry. |
| onCancel → "Come back anytime" + Resume button | ⏳ **Not tested** | Cancel/close Persona flow without completing; should show resume message. |
| Privacy note shows fund name | ⏳ **Not tested** | "Your ID is verified by Persona and never stored by [Fund Name]". |
| Unauthenticated create-inquiry → 401 | ⏳ **Not tested** | Call POST `/api/kyc/create-inquiry` without Privy token; should return 401. |
| Persona API key never exposed to browser | ⏳ **Not tested** | Inspect network/JS; only sessionToken from API, no API key in client. |

### Quick Reference – How to Test S3-1

1. Complete Steps 1–3 (account, personal info, accreditation).
2. Go to Step 4 → "Verify Your Identity".
3. Complete Persona flow (use Persona sandbox/test IDs if available).
4. **Resume test:** Start KYC, close tab, return to same apply URL, go to Step 4.

---

## S3-2 (Persona Webhook Handler)

**Prerequisites:** `PERSONA_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SUPABASE_*`, `APP_URL` in webhooks env. Point Persona Dashboard webhook URL to `https://your-host/persona`.

| Check | Status | Notes |
|-------|--------|-------|
| Non-HMAC request → 401 | ⏳ **Not tested** | POST /persona without valid Persona-Signature returns 401. |
| inquiry.approved → DB updated (kyc_status, kyc_completed_at, status) | ⏳ **Not tested** | Investor row: kyc_status='approved', status=accreditation_pending or kyc_pending. |
| inquiry.approved → KYC_APPROVED email to GP | ⏳ **Not tested** | GP receives "[Name] completed KYC - ready for review". |
| inquiry.declined → kyc_status='failed', kyc_result stored | ⏳ **Not tested** | Investor updated, decline codes in kyc_result. |
| inquiry.declined → rejection email to LP with reason + resubmit link | ⏳ **Not tested** | KycRejected email, resubmit URL = APP_URL/apply/{slug}/step/4. |
| inquiry.declined → notification to GP | ⏳ **Not tested** | KycDeclinedGp email. |
| inquiry.expired / inquiry.failed → DB + activity_log | ⏳ **Not tested** | kyc_status updated, activity logged. |
| Return 200 immediately after DB update | ⏳ **Not tested** | Persona retries on non-200; handler returns 200 after processing. |
| Test with Persona webhook tester | ⏳ **Not tested** | Use real inquiry ID in Persona Dashboard. |

---

## S3-3 (GP KYC Review Queue & Real-Time Status)

| Check | Status | Notes |
|-------|--------|-------|
| Investors table: sortable, filterable, pagination, CSV export | ⏳ **Not tested** | Dashboard > Investors. Filter by KYC/accreditation, search, Export CSV. |
| KYC queue: only kyc_status='approved' awaiting GP review | ⏳ **Not tested** | Dashboard > Investors > KYC Queue. Sorted by kyc_completed_at. |
| Expand row → KYC summary (name, DOB, nationality) | ⏳ **Not tested** | Click row to expand. |
| Approve → status='approved', email to LP | ⏳ **Not tested** | Approve button. Verify investor status + LP receives email. |
| Reject → modal with reason, email to LP | ⏳ **Not tested** | Reject button. Select reason, add notes, submit. |
| GP cannot approve investors from another GP's fund | ⏳ **Not tested** | 403 on approve/reject for other fund. |
| LP status page updates within 3 seconds when GP approves | ⏳ **Not tested** | LP on /investor/[id]/status with "under review" → GP approves → LP sees update. |
| LP status page: "Your application is being reviewed..." with live dot | ⏳ **Not tested** | When status is kyc_pending or accreditation_pending. |

---

## S4-1 (DocuSign Embedded Signing – Step 5)

**Prerequisites:** DocuSign env vars (`DOCUSIGN_INTEGRATION_KEY`, `DOCUSIGN_IMPERSONATED_USER_ID`, `DOCUSIGN_PRIVATE_KEY`). Upload subscription template to Supabase Storage at `templates/{fundId}/subscription_agreement.pdf`. Run migration 005 (or create buckets `templates` and `signed-documents` in Supabase Storage). For webhook: `DOCUSIGN_WEBHOOK_SECRET` in webhooks env; point DocuSign Connect to `https://your-host/docusign`.

| Check | Status | Notes |
|-------|--------|-------|
| Step 5 loads after completing Step 4 | ⏳ **Not tested** | Navigate to `/apply/[fund-slug]/step/5`. Should show "Sign Subscription Agreement". |
| create-session returns signingUrl, DocuSign iframe loads | ⏳ **Not tested** | Iframe (600px height on desktop) shows DocuSign signing UI. |
| **Complete signing** → doc_signed_at set, status=docs_pending, redirect to step 6 | ⏳ **Not tested** | Finish DocuSign flow. Check `investors.doc_signed_at` and `investors.status` = `docs_pending`. Should redirect to Step 6. |
| Return event: **cancel** → "Resume later" page with link back | ⏳ **Not tested** | Cancel DocuSign without signing. Should show resume message + link to Step 5. |
| Return event: **decline** → explanation + contact GP | ⏳ **Not tested** | Decline to sign. Should show explanation. |
| Return event: **session_timeout** → "Resume later" page | ⏳ **Not tested** | Let signing session expire (~5 min). Return URL should show resume page. |
| **Resume later** → same envelope, new signing URL | ⏳ **Not tested** | Return to Step 5 after cancel; should load same envelope (no new one created). |
| Webhook: signed PDF stored in Supabase | ⏳ **Not tested** | Bucket `signed-documents`, path `{investorId}/{envelopeId}_subscription_agreement.pdf`. |
| Webhook: documents row created (type=signed_subscription) | ⏳ **Not tested** | Check `documents` table after signing. |
| Webhook: investor status → docs_pending | ⏳ **Not tested** | Envelope-completed webhook updates investor. |
| Unauthenticated create-session → 401 | ⏳ **Not tested** | POST `/api/docusign/create-session` without Privy token returns 401. |
| DocuSign webhook without valid HMAC → 401 | ⏳ **Not tested** | POST `/docusign` without valid X-DocuSign-Signature-1 returns 401. |

### Quick Reference – How to Test S4-1

1. Complete Steps 1–4 (invite, apply, accreditation, KYC).
2. Go to Step 5 → "Sign Subscription Agreement".
3. Complete DocuSign flow in iframe (use DocuSign sandbox for test signing).
4. **Cancel test:** Start signing, cancel → verify "Resume later" page, return and resume.
5. **Webhook test:** After signing, confirm signed PDF in `signed-documents` bucket and `documents` row.

---

## S4-2 (Wallet Connect – Step 6)

**Prerequisites:** Complete Steps 1–5. Privy configured (NEXT_PUBLIC_PRIVY_APP_ID). For whitelist check: fund must have `token_config.contract_addr` and S5 blockchain service deployed.

| Check | Status | Notes |
|-------|--------|-------|
| Step 6 loads after completing Step 5 | ⏳ **Not tested** | Navigate to `/apply/[fund-slug]/step/6`. Should show "Connect Your Wallet". |
| Three option cards visible | ⏳ **Not tested** | Connect Existing Wallet, Create New Wallet, Enter Address Manually. |
| **Option 1 – Connect Existing Wallet** | ⏳ **Not tested** | Click Connect → Privy modal → MetaMask/WalletConnect. After connect: truncated address (e.g. 0x1234...5678) shown. |
| **Option 2 – Create New Wallet** | ⏳ **Not tested** | Click Create → Privy embedded wallet created. Address shown. Copy: "Your wallet is secured by your email. No seed phrase needed." |
| **Option 3 – Manual address** | ⏳ **Not tested** | Select manual, paste valid address. Warning: "Make sure you control this wallet. Tokens sent here are non-recoverable." |
| Manual invalid address rejected | ⏳ **Not tested** | Enter e.g. `0xinvalid` or `abc` → inline error "Invalid Ethereum address", Continue disabled. |
| **Use this wallet & Continue** | ⏳ **Not tested** | Select address → click → wallet saved to `investors.wallet_address`, redirect to Step 7. |
| wallet_address stored checksummed | ⏳ **Not tested** | Verify DB: `investors.wallet_address` is checksummed (e.g. mixed case). |
| Already whitelisted message | ⏳ **Not tested** | When fund has contract + address on whitelist: "This address is already in our system" shown. Still proceeds to Step 7. |
| Unauthenticated save-wallet → 401 | ⏳ **Not tested** | POST `/api/apply/save-wallet` without Privy token returns 401. |
| Visit /step/6 without Step 5 complete → redirect | ⏳ **Not tested** | Redirect to /step/1. |

### Quick Reference – How to Test S4-2

1. Complete Steps 1–5 first.
2. Go to Step 6 → "Connect Your Wallet".
3. **Connect test:** Click Connect → link MetaMask or WalletConnect → verify truncated address → Use this wallet & Continue → check `investors.wallet_address` in DB.
4. **Create test:** Click Create → embedded wallet created → Use this wallet & Continue.
5. **Manual test:** Select manual → paste valid `0x...` address → Use this wallet & Continue. Try invalid address → should reject.

---

## S4-3 (Application Review & Submission – Step 7)

**Prerequisites:** Complete Steps 1–6. `RESEND_API_KEY` for emails.

| Check | Status | Notes |
|-------|--------|-------|
| Step 7 loads after completing Step 6 | ⏳ **Not tested** | Navigate to `/apply/[fund-slug]/step/7`. Should show "Review & Submit". |
| Summary cards show: Personal Info, Accreditation, KYC, Agreement, Wallet | ⏳ **Not tested** | All 5 sections in card layout. KYC: "Verified by Persona" with green checkmark. |
| Agreement: signed date + download link | ⏳ **Not tested** | "Signed [date]" and "Download signed agreement" link (if signed doc exists). |
| Investment amount input (min/max from fund) | ⏳ **Not tested** | Shown when amount not pre-set. Validates min/max. |
| Legal checkbox required | ⏳ **Not tested** | "Submit Application" disabled until checkbox checked. |
| Submit → status=kyc_pending, redirect to success | ⏳ **Not tested** | Submit Application → success page. Check `investors.status` = `kyc_pending`, `subscription_amount_cents` set. |
| Success page: confirmation + link to status | ⏳ **Not tested** | "Application Submitted!", "View application status" → `/investor/[id]/status`. "What happens next" timeline. |
| LP status page: 7-stage progress tracker | ⏳ **Not tested** | Applied → KYC Review → Documents → Approved → Whitelisted → Funded. Current stage highlighted. |
| Status page: "Your application is being reviewed..." with live dot | ⏳ **Not tested** | When kyc_pending or accreditation_pending. |
| Status page: Documents section, download signed agreement | ⏳ **Not tested** | Download link for signed subscription PDF. |
| ApplicationReceived email to LP | ⏳ **Not tested** | LP receives "We got your application" with status link. |
| NewApplication email to GP | ⏳ **Not tested** | GP receives "New application: [Name] - [Fund]" with dashboard link. |
| Complete flow invite → submission in one session | ⏳ **Not tested** | End-to-end: invite link → Step 1–7 → Submit → Success. |
| GP sees new investor in dashboard after LP submits | ⏳ **Not tested** | Dashboard > Investors shows new row with kyc_pending status. |
| Unauthenticated submit → 401 | ⏳ **Not tested** | POST `/api/investors/[id]/submit` without Privy token returns 401. |

### Quick Reference – How to Test S4-3

1. Complete Steps 1–6 (invite → apply → accreditation → KYC → DocuSign → wallet).
2. Go to Step 7 → review summary, enter amount if needed, check legal box, Submit.
3. Success page → "View application status" → LP status page.
4. Verify 7-stage progress tracker, documents download link, "being reviewed" message.
5. Check emails: LP gets ApplicationReceived, GP gets NewApplication.
6. GP Dashboard → Investors → new investor visible.

---

## S2-3 (Accreditation Step)

| Check | Status | Notes |
|-------|--------|-------|
| Run storage migration | ⏳ **Required first** | Run migration 004 or create bucket "accreditation" (private) in Supabase Dashboard > Storage |
| Uploaded file NOT publicly accessible | ⏳ **Not tested** | Try direct Supabase Storage URL; should return 403/404. Bucket is private. |
| GP dashboard shows accreditation type for each investor | ⏳ **Not tested** | Dashboard > Investors. Complete Step 3 as LP, then check GP view. |
| Method cards: Income, Net Worth, Professional, Entity | ⏳ **Not tested** | All 4 options selectable; upload shown for A, B, D; license inputs for C. |
| Upload: drag-and-drop + click, PDF/JPG/PNG, max 10MB | ⏳ **Not tested** | Reject oversized or wrong format. |
| Re-upload replaces existing | ⏳ **Not tested** | Upload again after first upload; new file should replace. |

## S2-1 (Investor Invite Flow)

| Check | Status | Notes |
|-------|--------|-------|
| GP invites via email → invite email received, link works | ⏳ **Not tested** | Blocker: Resend free tier only allows sending to the account owner's verified email (`priyadarshinishant84@gmail.com`). Sending to `nishant@seleric.ai` returns 500. Use verified email or verify a domain at resend.com/domains. |
| GP copies generic invite link → link is correct | ✅ **Verified** | Copy Link tab works; URL format is correct. |
| Valid invite link → lands on /apply/[fund-slug], email pre-filled in Step 1 | ⏳ **Partially blocked** | Link lands correctly. Email pre-fill works when using a valid token. Full flow blocked by Privy/Step 1 OTP issues (see below). |
| Expired token → shows "Link expired" | ⏳ **Not tested** | Requires creating a token with past expiry (e.g. temporarily change `setExpirationTime` in `lib/invite-jwt.ts` to `-1h`). |

---

## S2-2 (Apply Flow)

| Check | Status | Notes |
|-------|--------|-------|
| Refresh mid-step → form data still present (sessionStorage) | ⏳ **Not tested** | Can test on Step 2 after completing Step 1. |
| Visit /step/3 without finishing 1–2 → redirect to /step/1 | ⏳ **Not tested** | Should redirect; needs manual check. |
| Step 1 → Privy OTP flow completes, profile created, redirect to Step 2 | ⏳ **Blocked** | Error: "User already has one email account linked". Privy blocks when email is already linked. Use `priyadarshinishant063@gmail.com` (the Privy user) or a new email never used before. |
| Step 2 → validation works, required fields enforced, DOB 18+ | ⏳ **Not tested** | Step 2 not reached due to Step 1 blocker. Form: `/apply/[fund-slug]/step/2`. |

---

## Known Blockers

1. **Resend**: Test emails only go to verified email. For other recipients, verify a domain and use a custom `from` address.
2. **Privy**: "User already has one email account linked" when reusing an email. Use the email shown in Privy Users or a brand-new email.
3. **Supabase vs Privy**: Deleting a user in Supabase does *not* remove them from Privy. Use [Privy Dashboard](https://dashboard.privy.io) → Users → All users to manage Privy accounts.

---

## Quick Reference – How to Test

### S2-1 Invite
- **GP Dashboard** → Funds → [select fund] → **Invite investor**
- **Send via Email** tab: requires `RESEND_API_KEY`, recipient = Resend verified email only
- **Copy Link** tab: no email needed; copy and open link in incognito

### S2-2 Apply
- Open invite link (or `http://localhost:3000/apply/[fund-slug]`)
- Click **Begin Application** → Step 1 (email + phone + OTP) → Step 2 (personal info)
- Use `priyadarshinishant063@gmail.com` or a new email to avoid Privy linking error

### S2-3 Accreditation
- Complete Steps 1 & 2 first, then go to Step 3
- Select a method (e.g. Net Worth) → upload PDF/JPG/PNG → Continue
- Or select Professional → enter license number + type → Continue
- Verify: **GP Dashboard** → **Investors** shows Accreditation column with the chosen type

### S4-1 DocuSign (Step 5)
- Complete Steps 1–4 first
- Upload subscription template: Supabase Storage → `templates` bucket → `{fund_id}/subscription_agreement.pdf`
- Go to Step 5 → DocuSign iframe loads
- Sign in DocuSign sandbox → redirects to complete page → Step 6
- Cancel/decline/timeout → "Resume later" or decline message

### S4-2 Wallet Connect (Step 6)
- Complete Steps 1–5 first
- Go to Step 6 → three options: Connect (MetaMask/WalletConnect), Create (Privy embedded), or Manual
- Connect or Create → verify address shown → Use this wallet & Continue → Step 7
- Manual → paste valid 0x address → invalid addresses rejected with inline error

### S4-3 Review & Submit (Step 7)
- Complete Steps 1–6 first
- Go to Step 7 → review summary, amount input (if needed), legal checkbox, Submit
- Success page → "View application status" → LP status page
- LP status: 7-stage progress, documents download, "being reviewed" with live dot
- Verify emails: LP (ApplicationReceived), GP (NewApplication)

### S5-1 Hardhat & ERC-3643 Contracts
- **Tests:** `cd apps/blockchain && npx hardhat test` → 3 tests pass

### S5-2 Blockchain Service & Auto-Whitelist
- **Prerequisites:** `DEPLOYER_WALLET_PRIVATE_KEY`, `FACTORY_CONTRACT_ADDRESS`, `POLYGON_RPC_URL` (or `NEXT_PUBLIC_POLYGON_RPC`)
- **Auto-whitelist:** GP approves investor → wallet whitelisted when fund has contract_addr
- **Manual:** POST `/api/investors/[id]/whitelist` (GP) → `{ txHash, polygonscanUrl }`
