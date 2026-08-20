import path from "node:path";
import type { DataSourceOptions } from "typeorm";
import { DataSource } from "typeorm";
import type { Env } from "../_config/env.config";
import { loadEnv } from "../_config/env.config";

export const dataSourceClient = (env: Env): DataSourceOptions => ({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [path.join(__dirname, "entities", "**", "*.entity.{ts,js}")],
  migrations: [path.join(__dirname, "migrations", "*.{ts,js}")],
  ssl: { rejectUnauthorized: false },
  synchronize: false,
});

// The TypeORM CLI wants a DataSource instance, not the options factory the Nest module uses.
export default new DataSource(dataSourceClient(loadEnv()));
