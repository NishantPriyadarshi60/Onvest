/** Typed env access; server-only required vars throw when validated. */

const REQUIRED_SERVER_KEYS = [
  "SUPABASE_SERVICE_ROLE_KEY",
  "PERSONA_API_KEY",
  "PERSONA_WEBHOOK_SECRET",
  "DOCUSIGN_INTEGRATION_KEY",
  "DOCUSIGN_WEBHOOK_HMAC",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "DEPLOYER_WALLET_PRIVATE_KEY",
  "RESEND_API_KEY",
] as const;

export type RequiredServerKey = (typeof REQUIRED_SERVER_KEYS)[number];

/**
 * Get env var. Throws with a descriptive error if required and missing (server-side).
 * NEXT_PUBLIC_* vars warn but never throw (client-safe).
 */
export function getEnvVar(key: string, required?: boolean): string | undefined {
  const value = process.env[key];
  if (required && (value === undefined || value === "")) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  if (
    !required &&
    key.startsWith("NEXT_PUBLIC_") &&
    (value === undefined || value === "")
  ) {
    console.warn(`[config] NEXT_PUBLIC_ var empty or missing: ${key}`);
  }
  return value;
}

export interface Config {
  nextPublicSupabaseUrl: string | undefined;
  supabaseServiceRoleKey: string | undefined;
  nextPublicPrivyAppId: string | undefined;
  personaApiKey: string | undefined;
  personaWebhookSecret: string | undefined;
  docusignIntegrationKey: string | undefined;
  docusignWebhookHmac: string | undefined;
  stripeSecretKey: string | undefined;
  stripeWebhookSecret: string | undefined;
  nextPublicPolygonRpc: string | undefined;
  deployerWalletPrivateKey: string | undefined;
  resendApiKey: string | undefined;
  nextPublicAppUrl: string | undefined;
  databaseUrl: string | undefined;
  databaseSchema: string;
}

/** Build typed config at module load. Client-safe: only NEXT_PUBLIC_* are guaranteed. */
function loadConfig(): Config {
  return {
    nextPublicSupabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL"),
    supabaseServiceRoleKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY"),
    nextPublicPrivyAppId: getEnvVar("NEXT_PUBLIC_PRIVY_APP_ID"),
    personaApiKey: getEnvVar("PERSONA_API_KEY"),
    personaWebhookSecret: getEnvVar("PERSONA_WEBHOOK_SECRET"),
    docusignIntegrationKey: getEnvVar("DOCUSIGN_INTEGRATION_KEY"),
    docusignWebhookHmac: getEnvVar("DOCUSIGN_WEBHOOK_HMAC"),
    stripeSecretKey: getEnvVar("STRIPE_SECRET_KEY"),
    stripeWebhookSecret: getEnvVar("STRIPE_WEBHOOK_SECRET"),
    nextPublicPolygonRpc: getEnvVar("NEXT_PUBLIC_POLYGON_RPC"),
    deployerWalletPrivateKey: getEnvVar("DEPLOYER_WALLET_PRIVATE_KEY"),
    resendApiKey: getEnvVar("RESEND_API_KEY"),
    nextPublicAppUrl: getEnvVar("NEXT_PUBLIC_APP_URL"),
    databaseUrl: getEnvVar("DATABASE_URL"),
    databaseSchema: getEnvVar("DATABASE_SCHEMA") ?? "public",
  };
}

export const config = loadConfig();

/**
 * Validate that all required server env vars are set. Call from server entry points (API, webhooks).
 * @throws Error if any required var is missing
 */
export function validateServerConfig(): void {
  const missing: string[] = [];
  for (const key of REQUIRED_SERVER_KEYS) {
    const value = process.env[key];
    if (value === undefined || value === "") {
      missing.push(key);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required server env vars: ${missing.join(", ")}. Check your .env or .env.local.`
    );
  }
}
