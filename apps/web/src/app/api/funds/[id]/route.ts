// apps/web/src/app/api/funds/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { getFundById } from "@onvest/db";

/** GET /api/funds/[id] - Get fund details (GP must own it). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session || session.profile.role !== "gp") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const fund = await getFundById(id);
  if (!fund || fund.gp_id !== session.profile.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(fund);
}
