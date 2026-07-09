import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE_NAME = "mentis_session";
export const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export type SessionPayload = {
  email: string;
  expiresAt: number;
};

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("base64url");
}

function isSessionPayload(value: unknown): value is SessionPayload {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { email?: unknown }).email === "string" &&
    typeof (value as { expiresAt?: unknown }).expiresAt === "number"
  );
}

export function createSessionToken(
  payload: SessionPayload,
  secret: string,
): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

export function verifySessionToken(
  token: string | undefined,
  options: { secret: string; now: number },
): SessionPayload | null {
  if (!token || !options.secret) return null;

  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = Buffer.from(sign(body, options.secret));
  const received = Buffer.from(signature);
  if (expected.length !== received.length) return null;
  if (!timingSafeEqual(expected, received)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!isSessionPayload(payload)) return null;
  if (payload.expiresAt <= options.now) return null;
  return payload;
}
