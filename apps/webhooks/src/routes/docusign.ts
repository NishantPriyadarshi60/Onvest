/**
 * DocuSign Connect webhook handler.
 * HMAC verification (X-DocuSign-Signature-1), envelope-completed handling.
 * On envelope-completed: download signed PDF, store to Supabase, create documents record, update investor.
 */
import crypto from "node:crypto";
import { Request, Response } from "express";
import {
  getInvestorByEnvelopeId,
  getFundById,
  updateInvestor,
  insertDocument,
  insertActivityLog,
} from "@onvest/db";
import { createServerClient } from "@onvest/db/client";
import { downloadSignedDocument } from "../lib/docusign.js";

const WEBHOOK_SECRET = process.env.DOCUSIGN_WEBHOOK_SECRET;

/**
 * Verify DocuSign Connect HMAC signature.
 * X-DocuSign-Signature-1: base64(HMAC-SHA256(secret, rawBody))
 * x-authorization-digest: HMACSHA256
 */
function verifySignature(rawBody: Buffer | string, signatureHeader: string | undefined): boolean {
  if (!WEBHOOK_SECRET || !signatureHeader) return false;
  const body = typeof rawBody === "string" ? rawBody : rawBody.toString("utf8");
  try {
    const expected = crypto
      .createHmac("sha256", WEBHOOK_SECRET)
      .update(body)
      .digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(signatureHeader, "base64"),
      Buffer.from(expected, "base64")
    );
  } catch {
    return false;
  }
}

function extractPayload(body: unknown): {
  event?: string;
  envelopeId?: string;
  status?: string;
} {
  if (!body || typeof body !== "object") return {};
  const b = body as Record<string, unknown>;
  const data = b.data as Record<string, unknown> | undefined;
  const summary = data?.envelopeSummary as Record<string, unknown> | undefined;
  const envelopeId =
    (summary?.envelopeId as string) ??
    (data?.envelopeId as string) ??
    (b.envelopeId as string);
  const status =
    (summary?.status as string) ?? (data?.status as string) ?? (b.status as string);
  const event = (b.event as string) ?? (data?.event as string);
  return { event, envelopeId, status };
}

async function handleEnvelopeCompleted(envelopeId: string): Promise<void> {
  const investor = await getInvestorByEnvelopeId(envelopeId);
  if (!investor) {
    console.warn("DocuSign webhook: no investor for envelope", envelopeId);
    return;
  }

  const fund = await getFundById(investor.fund_id);
  if (!fund) return;

  const buffer = await downloadSignedDocument(envelopeId, "combined");

  const supabase = createServerClient();
  const storagePath = `${investor.id}/${envelopeId}_subscription_agreement.pdf`;

  const { error: uploadError } = await supabase.storage
    .from("signed-documents")
    .upload(storagePath, buffer, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (uploadError) {
    console.error("DocuSign webhook: storage upload failed", uploadError);
    throw uploadError;
  }

  await insertDocument({
    investor_id: investor.id,
    fund_id: investor.fund_id,
    type: "signed_subscription",
    storage_path: storagePath,
    file_name: "subscription_agreement_signed.pdf",
    uploaded_by: null,
  });

  await updateInvestor(investor.id, {
    doc_signed_at: new Date().toISOString(),
    status: "docs_pending",
  });

  await insertActivityLog({
    fund_id: investor.fund_id,
    investor_id: investor.id,
    actor_id: investor.profile_id ?? fund.gp_id,
    action: "doc_signed",
    metadata: { envelope_id: envelopeId },
  });
}

/**
 * Handler expects req.body to be Buffer (from express.raw).
 * Mount with: app.post("/docusign", express.raw({ type: "application/json" }), docusignHandler);
 */
export function docusignHandler(req: Request, res: Response): void {
  const rawBody = req.body;
  if (!rawBody || !Buffer.isBuffer(rawBody)) {
    res.status(400).send("Missing body");
    return;
  }

  if (!WEBHOOK_SECRET) {
    console.error("DOCUSIGN_WEBHOOK_SECRET not configured");
    res.status(500).send("Webhook not configured");
    return;
  }

  const signature = req.headers["x-docusign-signature-1"] as string | undefined;
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

  const { event, envelopeId, status } = extractPayload(body);

  if (!envelopeId) {
    console.warn("DocuSign webhook: no envelopeId in payload");
    res.status(200).send("OK");
    return;
  }

  const isCompleted = status === "completed";

  if (!isCompleted) {
    res.status(200).send("OK");
    return;
  }

  handleEnvelopeCompleted(envelopeId)
    .then(() => {
      res.status(200).send("OK");
    })
    .catch((err) => {
      console.error("DocuSign webhook error:", err);
      res.status(500).send("Internal error");
    });
}
