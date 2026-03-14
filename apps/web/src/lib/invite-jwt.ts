// apps/web/src/lib/invite-jwt.ts
import * as jose from "jose";

const SECRET = process.env.INVITE_JWT_SECRET ?? "";
const ALG = "HS256";

export interface InviteTokenPayload {
  email?: string;
  fundId: string;
  exp: number;
}

export async function signInviteToken(payload: Omit<InviteTokenPayload, "exp">): Promise<string> {
  if (!SECRET) throw new Error("INVITE_JWT_SECRET is required");
  const secret = new TextEncoder().encode(SECRET);
  return new jose.SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALG })
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifyInviteToken(token: string): Promise<InviteTokenPayload | null> {
  if (!SECRET) return null;
  try {
    const secret = new TextEncoder().encode(SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return {
      email: payload.email as string | undefined,
      fundId: payload.fundId as string,
      exp: (payload.exp ?? 0) as number,
    };
  } catch {
    return null;
  }
}
