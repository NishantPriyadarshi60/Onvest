/**
 * DocuSign SDK wrapper - server-side only.
 * JWT Grant auth, create envelope, embedded signing URL.
 * Docs: https://developers.docusign.com
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

export interface InvestorData {
  investorName: string;
  investorEmail: string;
  fundName: string;
  investmentAmountCents: number;
}

export interface CreateEnvelopeResult {
  envelopeId: string;
}

/**
 * Create an envelope with the subscription document and investor as signer.
 * documentBase64: base64-encoded PDF from Supabase Storage.
 */
export async function createEnvelope(
  investorId: string,
  _fundId: string,
  investorData: InvestorData,
  documentBase64: string
): Promise<CreateEnvelopeResult> {
  const { accountId, baseUri } = await getAccountInfo();
  const accessToken = await getAccessToken();

  const clientUserId = investorId;
  const signer = {
    email: investorData.investorEmail,
    name: investorData.investorName,
    recipientId: "1",
    clientUserId,
    tabs: {
      fullNameTabs: [{ tabLabel: "investorName", value: investorData.investorName }],
      emailTabs: [{ tabLabel: "investorEmail", value: investorData.investorEmail }],
      textTabs: [
        { tabLabel: "fundName", value: investorData.fundName },
        {
          tabLabel: "investmentAmount",
          value: (investorData.investmentAmountCents / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD",
          }),
        },
        {
          tabLabel: "date",
          value: new Date().toLocaleDateString("en-US"),
        },
      ],
    },
  };

  const envelopeDefinition = {
    emailSubject: `Subscription Agreement - ${investorData.fundName}`,
    documents: [
      {
        documentBase64,
        name: "Subscription Agreement.pdf",
        fileExtension: "pdf",
        documentId: "1",
      },
    ],
    recipients: {
      signers: [signer],
    },
    status: "sent",
  };

  const res = await fetch(`${apiBase(accountId, baseUri)}/envelopes`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(envelopeDefinition),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign createEnvelope failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { envelopeId?: string };
  if (!data.envelopeId) throw new Error("DocuSign createEnvelope did not return envelopeId");
  return { envelopeId: data.envelopeId };
}

/**
 * Create embedded signing URL (recipient view). Valid ~5 minutes.
 */
export async function createEmbeddedSigningUrl(
  envelopeId: string,
  signerEmail: string,
  signerName: string,
  clientUserId: string,
  returnUrl: string
): Promise<string> {
  const { accountId, baseUri } = await getAccountInfo();
  const accessToken = await getAccessToken();

  const viewRequest = {
    returnUrl,
    authenticationMethod: "none",
    email: signerEmail,
    userName: signerName,
    clientUserId,
    recipientId: "1",
  };

  const res = await fetch(
    `${apiBase(accountId, baseUri)}/envelopes/${envelopeId}/views/recipient`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(viewRequest),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign createRecipientView failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("DocuSign createRecipientView did not return url");
  return data.url;
}

/**
 * Get envelope status.
 */
export async function getEnvelopeStatus(envelopeId: string): Promise<string> {
  const { accountId, baseUri } = await getAccountInfo();
  const accessToken = await getAccessToken();

  const res = await fetch(`${apiBase(accountId, baseUri)}/envelopes/${envelopeId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DocuSign getEnvelope failed: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { status?: string };
  return data.status ?? "unknown";
}

/**
 * Download signed document from completed envelope as base64.
 * Use docChoice "combined" for merged PDF.
 */
export async function downloadSignedDocument(
  envelopeId: string,
  docChoice = "combined"
): Promise<string> {
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
  return Buffer.from(arrayBuffer).toString("base64");
}
