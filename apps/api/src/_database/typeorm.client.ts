import path from "node:path";
import type { DataSourceOptions } from "typeorm";
import type { Env } from "../_config/env.config";

export const dataSourceClient = (env: Env): DataSourceOptions => ({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [path.join(__dirname, "entities", "**", "*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  // Postgres ships gen_random_uuid() in core; the uuid-ossp default would need an extension Supabase does not enable.
  uuidExtension: "pgcrypto",
});
