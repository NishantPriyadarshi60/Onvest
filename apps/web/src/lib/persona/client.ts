/**
 * Persona API client - server-side only.
 * Never expose PERSONA_API_KEY to the browser.
 * Docs: https://docs.withpersona.com
 */

const PERSONA_API_BASE = "https://api.withpersona.com/api/v1";
const API_KEY = process.env.PERSONA_API_KEY;
const TEMPLATE_ID = process.env.PERSONA_INQUIRY_TEMPLATE_ID;

export interface CreateInquiryResult {
  inquiryId: string;
  sessionToken: string;
}

export interface PersonaInquiry {
  id: string;
  attributes: {
    status: string;
    "reference-id"?: string;
    "inquiry-template-id"?: string;
  };
}

function getHeaders(): HeadersInit {
  if (!API_KEY) throw new Error("PERSONA_API_KEY is not configured");
  return {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Create a new Persona inquiry for the given investor.
 * Sets referenceId = investorId for webhook correlation.
 * Returns inquiryId and sessionToken for the embed.
 */
export async function createInquiry(
  investorId: string,
  email: string
): Promise<CreateInquiryResult> {
  if (!TEMPLATE_ID) throw new Error("PERSONA_INQUIRY_TEMPLATE_ID is not configured");

  const res = await fetch(`${PERSONA_API_BASE}/inquiries`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "inquiry",
        attributes: {
          "inquiry-template-id": TEMPLATE_ID,
          "reference-id": investorId,
          subject: email,
          fields: { "email-address": email },
        },
      },
      meta: { "create-inquiry-session": true },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Persona createInquiry failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as {
    data?: { id?: string };
    meta?: { "session-token"?: string };
  };

  const inquiryId = json.data?.id;
  let sessionToken = json.meta?.["session-token"];

  if (!inquiryId) {
    throw new Error("Persona createInquiry did not return inquiryId");
  }

  if (!sessionToken) {
    const session = await createInquirySession(inquiryId);
    sessionToken = session.sessionToken;
  }

  return { inquiryId, sessionToken };
}

/** Create an inquiry session to obtain a session token (fallback if create doesn't return one). */
async function createInquirySession(
  inquiryId: string
): Promise<{ sessionToken: string }> {
  const res = await fetch(`${PERSONA_API_BASE}/inquiry-sessions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      data: {
        type: "inquiry-session",
        attributes: { "inquiry-id": inquiryId },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Persona createInquirySession failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { data?: { attributes?: { "session-token"?: string } }; meta?: { "session-token"?: string } };
  const sessionToken = json.data?.attributes?.["session-token"] ?? json.meta?.["session-token"];
  if (!sessionToken) throw new Error("Persona createInquirySession did not return sessionToken");
  return { sessionToken };
}

/**
 * Get inquiry details by ID.
 */
export async function getInquiry(inquiryId: string): Promise<PersonaInquiry | null> {
  const res = await fetch(`${PERSONA_API_BASE}/inquiries/${inquiryId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    if (res.status === 404) return null;
    const err = await res.text();
    throw new Error(`Persona getInquiry failed: ${res.status} ${err}`);
  }

  return (await res.json()) as PersonaInquiry;
}

/**
 * Resume an existing inquiry - returns a fresh session token.
 * Use when investor already has kyc_inquiry_id and inquiry is pending/incomplete.
 */
export async function resumeInquiry(inquiryId: string): Promise<{ sessionToken: string }> {
  const res = await fetch(`${PERSONA_API_BASE}/inquiries/${inquiryId}/resume`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Persona resumeInquiry failed: ${res.status} ${err}`);
  }

  const json = (await res.json()) as { meta?: { "session-token"?: string } };
  const sessionToken = json.meta?.["session-token"];

  if (!sessionToken) {
    throw new Error("Persona resumeInquiry did not return sessionToken");
  }

  return { sessionToken };
}
