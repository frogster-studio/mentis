import { describe, expect, it } from "vitest";

import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

const secret = "test-secret";
const now = 1_700_000_000_000;
const payload = { email: "alice@example.com", expiresAt: now + 60_000 };

describe("session token round-trip", () => {
  it("verifies a token it issued", () => {
    const token = createSessionToken(payload, secret);
    expect(verifySessionToken(token, { secret, now })).toEqual(payload);
  });

  it("rejects an expired token", () => {
    const token = createSessionToken(payload, secret);
    expect(
      verifySessionToken(token, { secret, now: payload.expiresAt }),
    ).toBeNull();
  });

  it("rejects a token signed with a different secret", () => {
    const token = createSessionToken(payload, "other-secret");
    expect(verifySessionToken(token, { secret, now })).toBeNull();
  });

  it("rejects a token whose body was tampered with", () => {
    const token = createSessionToken(payload, secret);
    const [, signature] = token.split(".");
    const forgedBody = Buffer.from(
      JSON.stringify({ ...payload, email: "mallory@example.com" }),
    ).toString("base64url");
    expect(
      verifySessionToken(`${forgedBody}.${signature}`, { secret, now }),
    ).toBeNull();
  });

  it("rejects a token with a truncated signature", () => {
    const token = createSessionToken(payload, secret);
    expect(verifySessionToken(token.slice(0, -2), { secret, now })).toBeNull();
  });

  it("rejects malformed tokens", () => {
    for (const token of [undefined, "", "garbage", "a.b.c", "not-json.sig"]) {
      expect(verifySessionToken(token, { secret, now })).toBeNull();
    }
  });

  it("rejects any token when the secret is empty", () => {
    const token = createSessionToken(payload, secret);
    expect(verifySessionToken(token, { secret: "", now })).toBeNull();
  });
});
