// apps/web/src/app/api/docusign/create-session/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import {
  getProfileByPrivyId,
  getInvestorById,
  getFundById,
  updateInvestor,
} from "@onvest/db";
import { createServerClient } from "@onvest/db/client";
import {
  createEnvelope,
  createEmbeddedSigningUrl,
  getEnvelopeStatus,
} from "@/lib/docusign/client";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
});

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? "http://localhost:3000";

/**
 * POST - Create or resume DocuSign embedded signing session.
 * Requires authenticated LP; investor must belong to user's profile.
 * Returns signingUrl for embedding in iframe.
 */
export async function POST(req: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const profile = await getProfileByPrivyId(privyId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const investor = await getInvestorById(body.investorId);
  if (!investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  if (investor.profile_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fund = await getFundById(investor.fund_id);
  if (!fund) {
    return NextResponse.json({ error: "Fund not found" }, { status: 404 });
  }

  try {
    let envelopeId = investor.docusign_envelope_id ?? null;

    if (envelopeId) {
      const status = await getEnvelopeStatus(envelopeId);
      if (status === "completed") {
        return NextResponse.json({
          error: "Document already signed",
          alreadySigned: true,
        });
      }
    } else {
      const supabase = createServerClient();
      const templatePath = `${investor.fund_id}/subscription_agreement.pdf`;
      const { data: fileData, error: downloadError } = await supabase.storage
        .from("templates")
        .download(templatePath);

      if (downloadError || !fileData) {
        return NextResponse.json(
          {
            error:
              "Subscription agreement template not found. Please contact the fund manager.",
          },
          { status: 404 }
        );
      }

      const buffer = Buffer.from(await fileData.arrayBuffer());
      const documentBase64 = buffer.toString("base64");

      const investorData = {
        investorName: investor.full_name ?? investor.email,
        investorEmail: investor.email,
        fundName: fund.name,
        investmentAmountCents: investor.subscription_amount_cents ?? 0,
      };

      const result = await createEnvelope(
        investor.id,
        investor.fund_id,
        investorData,
        documentBase64
      );
      envelopeId = result.envelopeId;
      await updateInvestor(investor.id, { docusign_envelope_id: envelopeId });
    }

    const returnUrl = `${APP_URL}/apply/${fund.slug}/step/5/complete?event={event}`;
    const signingUrl = await createEmbeddedSigningUrl(
      envelopeId,
      investor.email,
      investor.full_name ?? investor.email,
      investor.id,
      returnUrl
    );

    return NextResponse.json({ signingUrl, envelopeId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create signing session";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
