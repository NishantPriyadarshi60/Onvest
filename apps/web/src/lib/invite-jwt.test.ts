/**
 * @vitest-environment node
 * Uses node env to avoid jose/jose Uint8Array conflict with jsdom.
 */
import { describe, it, expect } from "vitest";
import { signInviteToken, verifyInviteToken } from "./invite-jwt";

describe("invite-jwt", () => {

  it("signs and verifies token with email", async () => {
    const token = await signInviteToken({
      email: "test@example.com",
      fundId: "fund-123",
    });
    expect(token).toBeTruthy();
    const payload = await verifyInviteToken(token);
    expect(payload).toEqual({
      email: "test@example.com",
      fundId: "fund-123",
      exp: expect.any(Number),
    });
  });

  it("signs and verifies token without email", async () => {
    const token = await signInviteToken({ fundId: "fund-456" });
    const payload = await verifyInviteToken(token);
    expect(payload?.email).toBeUndefined();
    expect(payload?.fundId).toBe("fund-456");
  });

  it("returns null for invalid token", async () => {
    const payload = await verifyInviteToken("invalid-token");
    expect(payload).toBeNull();
  });

  // Note: signInviteToken reads SECRET at module load, so we skip testing missing-secret
});
