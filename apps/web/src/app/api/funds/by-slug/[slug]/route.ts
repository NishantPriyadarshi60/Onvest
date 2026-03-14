// apps/web/src/app/api/funds/by-slug/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getFundBySlug } from "@onvest/db";

/**
 * GET - Public endpoint to fetch fund basics by slug (for apply flow).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const fund = await getFundBySlug(slug);
  if (!fund) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: fund.id,
    name: fund.name,
    slug: fund.slug,
    min_investment_cents: fund.min_investment_cents,
    target_raise_cents: fund.target_raise_cents,
  });
}
