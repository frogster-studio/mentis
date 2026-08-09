import { z } from "zod";

// Parsed once at boot; crash-fast on misconfiguration. bun auto-loads .env in
// dev, Railway injects real vars in prod — no dotenv, no @nestjs/config.
// Key inventory is locked: SUPABASE_URL + one sb_secret_* service key (#4);
// the admin surface adds zero env beyond /app verification (#7).
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().default(3000),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  CORS_ORIGINS: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;
export const ENV = Symbol("ENV");
export const loadEnv = (): Env => envSchema.parse(process.env);

export const corsOrigins = (env: Env): string[] =>
  env.CORS_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
