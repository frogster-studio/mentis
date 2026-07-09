import { describe, expect, it } from "vitest";

import { verifyCredentials } from "@/lib/auth/credentials";

const env = {
  allowedEmails: "alice@example.com,bob@example.com",
  sharedPassword: "correct horse battery staple",
};

describe("verifyCredentials", () => {
  it("accepts an allowlisted email with the correct password", () => {
    expect(
      verifyCredentials(
        { email: "alice@example.com", password: env.sharedPassword },
        env,
      ),
    ).toBe(true);
  });

  it("tolerates stray whitespace in the allowlist", () => {
    expect(
      verifyCredentials(
        { email: "bob@example.com", password: env.sharedPassword },
        { ...env, allowedEmails: " alice@example.com , bob@example.com " },
      ),
    ).toBe(true);
  });

  it("matches emails case-insensitively on both sides", () => {
    expect(
      verifyCredentials(
        { email: "Alice@Example.COM", password: env.sharedPassword },
        { ...env, allowedEmails: "ALICE@example.com" },
      ),
    ).toBe(true);
  });

  it("trims whitespace around the submitted email", () => {
    expect(
      verifyCredentials(
        { email: "  alice@example.com  ", password: env.sharedPassword },
        env,
      ),
    ).toBe(true);
  });

  it("rejects an email that is not on the allowlist", () => {
    expect(
      verifyCredentials(
        { email: "mallory@example.com", password: env.sharedPassword },
        env,
      ),
    ).toBe(false);
  });

  it("rejects a wrong password for an allowlisted email", () => {
    expect(
      verifyCredentials({ email: "alice@example.com", password: "wrong" }, env),
    ).toBe(false);
  });

  it("rejects everything when the allowlist env var is missing or empty", () => {
    for (const allowedEmails of [undefined, "", " , ,"]) {
      expect(
        verifyCredentials(
          { email: "alice@example.com", password: env.sharedPassword },
          { ...env, allowedEmails },
        ),
      ).toBe(false);
    }
  });

  it("rejects everything when the shared password env var is missing or empty", () => {
    for (const sharedPassword of [undefined, ""]) {
      expect(
        verifyCredentials(
          { email: "alice@example.com", password: "" },
          { ...env, sharedPassword },
        ),
      ).toBe(false);
    }
  });

  it("rejects an empty submitted email even when the allowlist has empty entries", () => {
    expect(
      verifyCredentials(
        { email: "", password: env.sharedPassword },
        { ...env, allowedEmails: ",alice@example.com," },
      ),
    ).toBe(false);
  });
});
