/**
 * DocuSign API helpers for webhook - download signed document.
 * Duplicated auth logic from apps/web to avoid cross-app imports.
 */
import * as jose from "jose";

const DS_CLIENT_ID = process.env.DOCUSIGN_INTEGRATION_KEY;
const DS_USER_ID = process.env.DOCUSIGN_IMPERSONATED_USER_ID;
const DS_ACCOUNT_ID = process.env.DOCUSIGN_ACCOUNT_ID;
const DS_AUTH_SERVER = process.env.DOCUSIGN_AUTH_SERVER ?? "account-d.docusign.com";

function getPrivateKey(): string {
  const key = process.env.DOCUSIGN_PRIVATE_KEY;
  if (!key) throw new Error("DOCUSIGN_PRIVATE_KEY is not configured");
  return key.replace(/\\n/g, "\n");
}

async function getAccessToken(): Promise<string> {
  if (!DS_CLIENT_ID || !DS_USER_ID) {
    throw new Error("DOCUSIGN_INTEGRATION_KEY and DOCUSIGN_IMPERSONATED_USER_ID required");
  }
  const privateKey = getPrivateKey();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: DS_CLIENT_ID,
    sub: DS_USER_ID,
    iat: now,
    exp: now + 3600,
    aud: DS_AUTH_SERVER,
    scope: "signature impersonation",
  };
  const key = await jose.importPKCS8(privateKey, "RS256");
  const jwt = await new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "RS256" })
    .sign(key);

  const res = await fetch(`https://${DS_AUTH_SERVER}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign JWT auth failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error("DocuSign auth did not return access_token");
  return data.access_token;
}

let _cachedAccount: { accountId: string; baseUri: string } | null = null;

async function getAccountInfo(): Promise<{ accountId: string; baseUri: string }> {
  if (DS_ACCOUNT_ID && process.env.DOCUSIGN_API_BASE) {
    return { accountId: DS_ACCOUNT_ID, baseUri: process.env.DOCUSIGN_API_BASE };
  }
  if (_cachedAccount) return _cachedAccount;
  const accessToken = await getAccessToken();
  const res = await fetch(`https://${DS_AUTH_SERVER}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("DocuSign userinfo failed");
  const data = (await res.json()) as {
    accounts?: Array<{ account_id?: string; base_uri?: string }>;
  };
  const acc = data.accounts?.[0];
  if (!acc?.account_id) throw new Error("DocuSign account not found");
  _cachedAccount = {
    accountId: acc.account_id,
    baseUri: acc.base_uri ?? "https://demo.docusign.net",
  };
  return _cachedAccount;
}

function apiBase(accountId: string, baseUri?: string): string {
  const base = baseUri ?? "https://demo.docusign.net";
  return `${base.replace(/\/$/, "")}/restapi/v2.1/accounts/${accountId}`;
}

/**
 * Download signed document from completed envelope as Buffer.
 */
export async function downloadSignedDocument(
  envelopeId: string,
  docChoice = "combined"
): Promise<Buffer> {
  const { accountId, baseUri } = await getAccountInfo();
  const accessToken = await getAccessToken();

  const res = await fetch(
    `${apiBase(accountId, baseUri)}/envelopes/${envelopeId}/documents/${docChoice}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign download failed: ${res.status} ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
