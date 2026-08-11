import type { Env } from "../src/env";

export const testEnv: Env = {
  PORT: 0,
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_stub",
  CORS_ORIGINS: [],
};
