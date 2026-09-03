import { z } from "zod";

// bun auto-loads .env in dev and Railway injects the vars in prod — no dotenv, no @nestjs/config.
const envSchema = z.object({
  PORT: z.coerce.number().int().default(3001),
  SUPABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.url(),
  CORS_ORIGINS: z
    .string()
    .default("")
    .transform((origins) =>
      origins
        .split(",")
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0),
    ),
  REVENUECAT_WEBHOOK_AUTH: z.string().min(1),
  REVENUECAT_REST_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;
export const ENV = Symbol("ENV");

export const loadEnv = (source: NodeJS.ProcessEnv = process.env): Env => envSchema.parse(source);
