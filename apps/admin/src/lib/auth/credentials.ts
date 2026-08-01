import { timingSafeEqual } from "node:crypto";

function parseAllowedEmails(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function verifyCredentials(
  input: { email: string; password: string },
  env: {
    allowedEmails: string | undefined;
    sharedPassword: string | undefined;
  },
): boolean {
  if (!env.sharedPassword) return false;
  const allowed = parseAllowedEmails(env.allowedEmails);
  const emailAllowed = allowed.includes(normalizeEmail(input.email));
  const passwordMatches = safeEqual(input.password, env.sharedPassword);
  return emailAllowed && passwordMatches;
}
