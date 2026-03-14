// apps/web/src/app/api/docusign/complete-step5/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import { getProfileByPrivyId, getInvestorById, updateInvestor } from "@onvest/db";
import { getEnvelopeStatus } from "@/lib/docusign/client";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
});

/**
 * POST - Mark step 5 (DocuSign signing) complete.
 * Called when user returns from DocuSign with signing_complete.
 * Updates doc_signed_at and status to docs_pending.
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

  if (!investor.docusign_envelope_id) {
    return NextResponse.json({ error: "No signing session found" }, { status: 400 });
  }

  try {
    const status = await getEnvelopeStatus(investor.docusign_envelope_id);
    if (status !== "completed") {
      return NextResponse.json(
        { error: "Document not yet completed" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json({ error: "Could not verify envelope status" }, { status: 500 });
  }

  await updateInvestor(investor.id, {
    doc_signed_at: new Date().toISOString(),
    status: "docs_pending",
  });

  return NextResponse.json({ ok: true });
}
