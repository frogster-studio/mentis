import { describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { loadEnv } from "./env";

const configured = {
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_stub",
};

describe("loadEnv", () => {
  it("applies the defaults for the vars .env.example deliberately omits", () => {
    const env = loadEnv(configured);
    expect(env.PORT).toBe(3001);
    expect(env.CORS_ORIGINS).toEqual([]);
  });

  it("coerces PORT from the string the platform injects", () => {
    expect(loadEnv({ ...configured, PORT: "8080" }).PORT).toBe(8080);
  });

  it("splits CORS_ORIGINS, trimming and dropping empty entries", () => {
    const env = loadEnv({ ...configured, CORS_ORIGINS: "https://a.dev, https://b.dev ," });
    expect(env.CORS_ORIGINS).toEqual(["https://a.dev", "https://b.dev"]);
  });

  it("throws a zod error when a required var is missing", () => {
    expect(() => loadEnv({ SUPABASE_SECRET_KEY: "sb_secret_stub" })).toThrow(ZodError);
  });

  it("throws a zod error when SUPABASE_URL is not a url", () => {
    expect(() => loadEnv({ ...configured, SUPABASE_URL: "not-a-url" })).toThrow(ZodError);
  });
});
