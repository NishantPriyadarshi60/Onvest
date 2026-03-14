// apps/web/src/app/api/send-invite/route.ts
import { NextRequest, NextResponse } from "next/server";
import { InvestorInvite, sendEmail } from "@onvest/email";
import { insertActivityLog } from "@onvest/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      fundId,
      fundName,
      gpName,
      inviteUrl,
      investorId,
      actorId,
      logoUrl,
      accentColor,
    } = body;

    if (!email || !fundId || !fundName || !gpName || !inviteUrl || !actorId) {
      return NextResponse.json(
        { error: "Missing required fields: email, fundId, fundName, gpName, inviteUrl, actorId" },
        { status: 400 }
      );
    }

    await sendEmail({
      to: email,
      subject: `You're invited to invest in ${fundName}`,
      react: InvestorInvite({
        fundName,
        gpName,
        inviteUrl,
        logoUrl: logoUrl ?? undefined,
        accentColor: accentColor ?? "#1D4ED8",
      }),
      template: "investor_invite",
      onSent: async ({ messageId }) => {
        await insertActivityLog({
          fund_id: fundId,
          investor_id: investorId ?? null,
          actor_id: actorId,
          action: "email_sent",
          metadata: { type: "investor_invite", messageId },
        });
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send-invite error:", e);
    return NextResponse.json(
      { error: (e as Error).message ?? "Failed to send email" },
      { status: 500 }
    );
  }
}
