// apps/web/src/app/api/funds/[id]/invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth";
import { createInvestor, getFundById } from "@onvest/db";
import { checkInvestorLimit } from "@/lib/stripe/limits";
import { signInviteToken } from "@/lib/invite-jwt";

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    requireRole(session, "gp");

    const { id: fundId } = await params;
    const fund = await getFundById(fundId);
    if (!fund) return NextResponse.json({ error: "Fund not found" }, { status: 404 });
    if (fund.gp_id !== session.profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      await checkInvestorLimit(fundId, session.profile.id);
    } catch (e) {
      const err = e as Error & { statusCode?: number };
      return NextResponse.json(
        { error: err.message, upgradeRequired: true },
        { status: err.statusCode ?? 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : undefined;

    const baseUrl = getBaseUrl(req);
    const applyPath = `/apply/${fund.slug}`;

    if (email) {
      const investor = await createInvestor({
        fund_id: fundId,
        email,
        status: "invited",
      });
      const token = await signInviteToken({ email, fundId });
      const inviteUrl = `${baseUrl}${applyPath}?token=${token}`;

      const branding = fund.branding as { logo_url?: string; accent_color?: string } | null;
      const inviteRes = await fetch(`${baseUrl}/api/send-invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          fundId,
          fundName: fund.name,
          gpName: session.profile.full_name,
          inviteUrl,
          investorId: investor.id,
          actorId: session.profile.id,
          logoUrl: branding?.logo_url,
          accentColor: branding?.accent_color ?? "#1D4ED8",
        }),
      });

      if (!inviteRes.ok) {
        const err = await inviteRes.json().catch(() => ({}));
        return NextResponse.json(
          { error: err.error ?? "Failed to send invite email" },
          { status: inviteRes.status }
        );
      }

      return NextResponse.json({
        success: true,
        inviteUrl,
        investorId: investor.id,
      });
    }

    const token = await signInviteToken({ fundId });
    const inviteUrl = `${baseUrl}${applyPath}?token=${token}`;
    return NextResponse.json({
      success: true,
      inviteUrl,
    });
  } catch (e) {
    const err = e as Error & { statusCode?: number };
    if (err.message === "Forbidden")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    console.error("invite error:", err);
    return NextResponse.json(
      { error: err.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
