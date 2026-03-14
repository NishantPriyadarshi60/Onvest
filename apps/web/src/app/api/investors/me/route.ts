// apps/web/src/app/api/investors/me/route.ts
import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { getFundById } from "@onvest/db";
import { createServerClient } from "@onvest/db/client";

/**
 * GET - List investor records for current LP (by profile_id).
 */
export async function GET() {
  const session = await requireAuth();
  requireRole(session, "lp");

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("investors")
    .select("*")
    .eq("profile_id", session.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Array<{ fund_id: string; [k: string]: unknown }>;
  const withFunds = await Promise.all(
    rows.map(async (inv) => {
      const fund = await getFundById(inv.fund_id);
      return { ...inv, fund_name: fund?.name ?? null, fund_slug: fund?.slug ?? null };
    })
  );

  return NextResponse.json(withFunds);
}
