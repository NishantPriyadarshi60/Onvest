# Onvest · RWA Platform

Monorepo for the Real World Asset tokenization platform (Phase 1: KYC & investor management for real estate syndicators).

## Setup

**Node.js 20.9+** required.

### Environment

Copy `.env.example` to `.env` and fill in values. For the Next.js app, copy `apps/web/.env.local.example` to `apps/web/.env.local`. **Never commit `.env` or `.env.local`** (they are gitignored).

- **DATABASE_URL** – Direct Postgres connection for migrations (e.g. `postgresql://postgres:password@localhost:5432/postgres`)
- **DATABASE_SCHEMA** – Schema name (default `public`; use `Onvest` if you want a custom schema)
- **SUPABASE_URL** / **SUPABASE_SERVICE_ROLE_KEY** – For Supabase Cloud (different from DATABASE_URL)

### Install dependencies

Use **npm** (no pnpm required):

```bash
npm install
```

Optional: install [pnpm](https://pnpm.io/installation) and use `pnpm install` instead (faster, uses `pnpm-workspace.yaml`).

### Run the Next.js app

```bash
npm run dev --workspace=web
```

Or from root with Turbo: `npm run dev` (runs all apps in dev mode).

## About the warnings you saw

- **Deprecated `glob`**: Comes from tooling (Next.js, ESLint, etc.). Safe to ignore until those packages update.
- **Deprecated `@walletconnect/*`**: Pulled in by Wagmi/viem. Newer WalletConnect packages exist; Wagmi will update in a future release.
- **Deprecated `@paulmillr/qr`**: From a dependency; no action needed for now.
- **31 vulnerabilities**: Most are in **apps/blockchain** (Hardhat 2 + toolbox). We use Hardhat 2 on purpose (Hardhat 3 is still alpha). Run `npm audit fix` for safe fixes; do **not** run `npm audit fix --force` unless you are ready to move to Hardhat 3 and fix breaking changes.

## Structure

- `apps/web` — Next.js 16 (frontend + API routes)
- `apps/webhooks` — Express (Persona, DocuSign, Stripe webhooks)
- `apps/blockchain` — Hardhat (ERC-3643 contracts)
- `packages/types` — Shared TypeScript types
- `packages/config` — Env validation
- `packages/db` — Supabase client & queries
- `packages/email` — React Email templates

See `docs/folder_structure.md` and `docs/Phase1_Cursor_Prompts.md` for the full build plan.

## Troubleshooting

- **"invalid or damaged lockfile"** — The lockfile was removed. Run `npm install` again; npm will create a new one.
- **EBUSY / EPERM or "napi-postinstall is not recognized"** — Something has files locked or the install is in a bad state:
  1. Stop any running dev server (Ctrl+C) and close extra terminals.
  2. Delete all `node_modules`: from repo root run  
     `rmdir /s /q node_modules apps\web\node_modules apps\webhooks\node_modules apps\blockchain\node_modules packages\types\node_modules packages\config\node_modules packages\db\node_modules packages\email\node_modules`  
     (or delete each `node_modules` folder in Explorer.)
  3. Run `npm install` again from the repo root in a **new** terminal.  
  If you still get EPERM, try running the terminal as Administrator or temporarily pause OneDrive sync for this folder.
