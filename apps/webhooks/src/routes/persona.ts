/**
 * Persona webhook handler - S3-2
 * HMAC verification, event handling, DB updates, emails
 */
import crypto from "node:crypto";
import { Request, Response } from "express";
import {
  getInvestorById,
  getFundById,
  getProfileById,
  updateInvestor,
  insertActivityLog,
} from "@onvest/db";
import { sendEmail, KycApproved, KycRejected, KycDeclinedGp, LpKycApproved } from "@onvest/email";

const WEBHOOK_SECRET = process.env.PERSONA_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Map Persona decline reason codes to human-readable messages */
const DECLINE_REASON_MAP: Record<string, string> = {
  "document-expired": "Your ID document has expired. Please use a valid, unexpired ID.",
  "document-unreadable": "We couldn't read your ID clearly. Please ensure the photo is clear and all text is visible.",
  "document-does-not-match": "The information on your ID doesn't match what you provided.",
  "face-mismatch": "Your selfie didn't match the photo on your ID.",
  "fraud-detected": "We detected potential fraud. If you believe this is an error, please contact support.",
  "duplicate-account": "This identity is already associated with another account.",
  "manual-review-declined": "Your verification was reviewed and could not be approved.",
};
const DEFAULT_DECLINE_REASON =
  "We were unable to verify your identity. Please ensure your ID is valid, clear, and matches the information you provided.";

function getDeclineReason(codes: string[] | undefined): string {
  if (!codes?.length) return DEFAULT_DECLINE_REASON;
  for (const code of codes) {
    const mapped = DECLINE_REASON_MAP[code] ?? DECLINE_REASON_MAP[code.replace(/_/g, "-")];
    if (mapped) return mapped;
  }
  return DEFAULT_DECLINE_REASON;
}

/**
 * Verify Persona webhook signature.
 * Persona-Signature: t=<timestamp>,v1=<hmac>
 * HMAC = HMAC-SHA256(secret, `${t}.${rawBody}`)
 */
function verifySignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.trim().split("=");
    if (k && v) acc[k] = v;
    return acc;
  }, {});
  const t: string | undefined = parts["t"];
  const v1: string | undefined = parts["v1"];
  if (!t || !v1 || typeof t !== "string" || typeof v1 !== "string") return false;
  const payload = `${t}.${body}`;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(payload).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(v1, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function extractPayload(body: unknown): {
  eventType?: string;
  inquiryId?: string;
  referenceId?: string;
  status?: string;
  declinedReasonCodes?: string[];
  fullPayload?: unknown;
} {
  if (!body || typeof body !== "object") return {};
  const data = (body as { data?: { id?: string; attributes?: Record<string, unknown> } }).data;
  if (!data) return {};
  const attrs = (data.attributes ?? {}) as Record<string, unknown>;
  const inquiryId: string | undefined = (data.id ?? attrs["inquiry-id"]) as string | undefined;
  const referenceId: string | undefined = attrs["reference-id"] as string | undefined;
  const status: string | undefined = attrs["status"] as string | undefined;
  const declinedReasonCodes: string[] | undefined = attrs["declined-reason-codes"] as string[] | undefined;
  const eventType: string | undefined = (body as { meta?: { "event-name"?: string } })?.meta?.["event-name"];
  return { eventType, inquiryId, referenceId, status, declinedReasonCodes, fullPayload: body };
}

async function handleInquiryApproved(
  investorId: string,
  payload: unknown
): Promise<void> {
  const investor = await getInvestorById(investorId);
  if (!investor) return;
  const fund = await getFundById(investor.fund_id);
  if (!fund) return;
  const gp = await getProfileById(fund.gp_id);

  const hasAccreditation = !!(investor.accreditation_type ?? investor.accreditation_doc_path);
  const newStatus = hasAccreditation ? "accreditation_pending" : "kyc_pending";

  await updateInvestor(investorId, {
    kyc_status: "approved",
    kyc_completed_at: new Date().toISOString(),
    kyc_result: (payload as Record<string, unknown>) ?? {},
    status: newStatus,
  });

  const investorName = investor.full_name ?? investor.email;

  if (gp?.email) {
    await sendEmail({
      to: gp.email,
      subject: `${investorName} completed KYC - ready for review`,
      react: KycApproved({
        investorName,
        fundName: fund.name,
        fundSlug: fund.slug,
      }),
    });
  }

  await sendEmail({
    to: investor.email,
    subject: `Identity verified - application under review for ${fund.name}`,
    react: LpKycApproved({
      investorName,
      fundName: fund.name,
    }),
  });

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: investor.profile_id ?? fund.gp_id,
    action: "kyc_approved",
    metadata: { inquiry_id: (payload as { data?: { id?: string } })?.data?.id },
  });
}

async function handleInquiryDeclined(
  investorId: string,
  payload: unknown,
  declinedReasonCodes?: string[]
): Promise<void> {
  const investor = await getInvestorById(investorId);
  if (!investor) return;
  const fund = await getFundById(investor.fund_id);
  if (!fund) return;
  const gp = await getProfileById(fund.gp_id);

  const reason = getDeclineReason(declinedReasonCodes);

  await updateInvestor(investorId, {
    kyc_status: "failed",
    kyc_result: (payload as Record<string, unknown>) ?? {},
    status: "kyc_failed",
  });

  const investorName = investor.full_name ?? investor.email;
  const resubmitUrl = `${APP_URL}/apply/${fund.slug}/step/4`;

  await sendEmail({
    to: investor.email,
    subject: `Identity verification for ${fund.name} was not completed`,
    react: KycRejected({
      investorName,
      fundName: fund.name,
      reason,
      resubmitUrl,
    }),
  });

  if (gp?.email) {
    await sendEmail({
      to: gp.email,
      subject: `KYC declined: ${investorName} - ${fund.name}`,
      react: KycDeclinedGp({
        investorName,
        fundName: fund.name,
        reason,
      }),
    });
  }

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: investor.profile_id ?? fund.gp_id,
    action: "kyc_declined",
    metadata: { declined_reason_codes: declinedReasonCodes },
  });
}

async function handleInquiryExpiredOrFailed(
  investorId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const investor = await getInvestorById(investorId);
  if (!investor) return;
  const fund = await getFundById(investor.fund_id);
  const actorId = investor.profile_id ?? fund?.gp_id;
  if (!actorId) return;

  await updateInvestor(investorId, {
    kyc_status: eventType === "inquiry.expired" ? "expired" : "failed",
    kyc_result: (payload as Record<string, unknown>) ?? {},
  });

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investorId,
    actor_id: actorId,
    action: eventType === "inquiry.expired" ? "kyc_expired" : "kyc_failed",
    metadata: {},
  });
}

/**
 * Handler expects req.body to be Buffer (from express.raw).
 * Mount with: app.post("/persona", express.raw({ type: "application/json" }), personaHandler);
 */
export function personaHandler(req: Request, res: Response): void {
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    res.status(400).send("Missing body");
    return;
  }

  if (!WEBHOOK_SECRET) {
      console.error("PERSONA_WEBHOOK_SECRET not configured");
    res.status(500).send("Webhook not configured");
    return;
  }

  const signature = req.headers["persona-signature"] as string | undefined;
  if (!verifySignature(rawBody, signature)) {
    res.status(401).send("Invalid signature");
    return;
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody.toString("utf8"));
  } catch {
    res.status(400).send("Invalid JSON");
    return;
  }

  const { eventType, referenceId, status, declinedReasonCodes, fullPayload } =
    extractPayload(body);

  const investorId = referenceId;
  if (!investorId) {
    console.warn("Persona webhook: no referenceId (investorId) in payload");
    res.status(200).send("OK");
    return;
  }

  const event = eventType ?? (body as { meta?: { "event_name"?: string } })?.meta?.event_name;

  const handle = async () => {
      switch (event) {
        case "inquiry.approved":
          await handleInquiryApproved(investorId, fullPayload ?? body);
          break;
        case "inquiry.declined":
          await handleInquiryDeclined(investorId, fullPayload ?? body, declinedReasonCodes);
          break;
        case "inquiry.completed":
          if (status === "approved") {
            await handleInquiryApproved(investorId, fullPayload ?? body);
          } else if (status === "declined" || status === "failed") {
            await handleInquiryDeclined(investorId, fullPayload ?? body, declinedReasonCodes);
          }
          break;
        case "inquiry.expired":
          await handleInquiryExpiredOrFailed(investorId, "inquiry.expired", fullPayload ?? body);
          break;
        case "inquiry.failed":
          await handleInquiryExpiredOrFailed(investorId, "inquiry.failed", fullPayload ?? body);
          break;
      default:
        console.log("Persona webhook: unhandled event", event);
    }
  };

  handle()
    .then(() => {
      res.status(200).send("OK");
    })
    .catch((err) => {
      console.error("Persona webhook error:", err);
      res.status(500).send("Internal error");
    });
}
