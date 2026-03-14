// apps/web/src/app/api/apply/save-accreditation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import {
  getProfileByPrivyId,
  getInvestorById,
  updateInvestor,
} from "@onvest/db";
import { z } from "zod";

const bodySchema = z.object({
  investorId: z.string().uuid(),
  accreditationType: z.enum(["income", "net_worth", "professional", "entity"]),
  accreditationDocPath: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseType: z.string().optional(),
});

/**
 * POST - Save accreditation method and optional doc path.
 * Called after upload or for professional cert (no upload).
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

  const needsUpload = ["income", "net_worth", "entity"].includes(body.accreditationType);
  const needsLicense = body.accreditationType === "professional";

  if (needsUpload && !body.accreditationDocPath) {
    return NextResponse.json(
      { error: "Document upload required for this accreditation method" },
      { status: 400 }
    );
  }

  if (needsLicense && (!body.licenseNumber || !body.licenseType)) {
    return NextResponse.json(
      { error: "License number and type required" },
      { status: 400 }
    );
  }

  await updateInvestor(body.investorId, {
    accreditation_type: body.accreditationType,
    accreditation_doc_path: body.accreditationDocPath ?? investor.accreditation_doc_path,
  });

  return NextResponse.json({ ok: true });
}
