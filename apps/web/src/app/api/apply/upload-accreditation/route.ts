// apps/web/src/app/api/apply/upload-accreditation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId } from "@/lib/auth";
import { createServerClient } from "@onvest/db/client";
import { getInvestorById } from "@onvest/db";

const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * POST - Upload accreditation document for investor.
 * Requires auth. Investor must belong to current user (profile match).
 */
export async function POST(req: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const investorId = formData.get("investorId") as string | null;

  if (!file || !investorId) {
    return NextResponse.json({ error: "Missing file or investorId" }, { status: 400 });
  }

  if (!ACCEPTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PDF, JPG, or PNG." },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File too large. Max 10MB." },
      { status: 400 }
    );
  }

  const { getProfileByPrivyId } = await import("@onvest/db");
  const profile = await getProfileByPrivyId(privyId);
  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const investor = await getInvestorById(investorId);
  if (!investor) {
    return NextResponse.json({ error: "Investor not found" }, { status: 404 });
  }

  if (investor.profile_id !== profile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ext = file.name.split(".").pop() || "bin";
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const path = `${investorId}/${timestamp}-${safeName}`;

  const supabase = createServerClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { data, error } = await supabase.storage
    .from("accreditation")
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    console.error("upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const fullPath = data.path;

  return NextResponse.json({
    path: fullPath,
    filename: file.name,
  });
}
