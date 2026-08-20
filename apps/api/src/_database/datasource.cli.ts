import { DataSource } from "typeorm";
import { loadEnv } from "../_config/env.config";
import { dataSourceClient } from "./typeorm.client";

// The TypeORM CLI wants a DataSource instance, not the options factory the Nest module uses.
export default new DataSource(dataSourceClient(loadEnv()));
