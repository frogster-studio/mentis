import type { DataSource } from "typeorm";
import type { Env } from "../_config/env.config";

export const testEnv: Env = {
  PORT: 0,
  SUPABASE_URL: "https://stub.supabase.co",
  SUPABASE_SECRET_KEY: "sb_secret_stub",
  DATABASE_URL: "postgresql://stub:stub@127.0.0.1:5432/stub",
  CORS_ORIGINS: [],
  REVENUECAT_WEBHOOK_AUTH: "Bearer webhook-secret",
  REVENUECAT_REST_KEY: "sk_test_stub",
  REVENUECAT_PROJECT_ID: "proj_test_stub",
};

// Stands in for Postgres the way the stub clients do: repositories are overridden per suite.
export const stubDataSource = {
  isInitialized: false,
  entityMetadatas: [],
  options: { type: "postgres" },
  getRepository: () => ({}),
} as unknown as DataSource;
