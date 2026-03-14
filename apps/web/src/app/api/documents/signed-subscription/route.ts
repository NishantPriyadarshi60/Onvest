// apps/web/src/app/api/documents/signed-subscription/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import {
  getProfileByPrivyId,
  getInvestorById,
  getSignedSubscriptionDoc,
} from "@onvest/db";
import { createServerClient } from "@onvest/db/client";

/**
 * GET - Returns signed URL for downloading signed subscription agreement.
 * LP auth; investor must belong to profile.
 */
export async function GET(req: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const investorId = searchParams.get("investorId");
  if (!investorId) {
    return NextResponse.json({ error: "investorId required" }, { status: 400 });
  }

  const profile = await getProfileByPrivyId(privyId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const investor = await getInvestorById(investorId);
  if (!investor || investor.profile_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const doc = await getSignedSubscriptionDoc(investorId);
  if (!doc) {
    return NextResponse.json(
      { error: "Signed document not found" },
      { status: 404 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.storage
    .from("signed-documents")
    .createSignedUrl(doc.storage_path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json(
      { error: "Could not generate download link" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: data.signedUrl });
}
