// apps/web/src/app/api/auth/onboarding/role/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getVerifiedUserId, syncUserToSupabase } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  role: z.enum(["gp", "lp"]),
  email: z.string().email().optional(),
});

/**
 * POST /api/auth/onboarding/role - Create profile for new user with chosen role.
 */
export async function POST(request: NextRequest) {
  const privyId = await getVerifiedUserId();
  if (!privyId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const privyUser = {
    id: privyId,
    email: { address: body.email ?? "" },
  };
  await syncUserToSupabase(privyUser, body.role);

  return NextResponse.json({ ok: true, role: body.role });
}
