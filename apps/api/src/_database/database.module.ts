import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../_config/config.module";
import { ENV, type Env } from "../_config/env.config";
import { dataSourceClient } from "./typeorm.client";

// forRootAsync so the options read the ENV provider — tests override the DataSource token through DI.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ENV],
      useFactory: (env: Env) => dataSourceClient(env),
    }),
  ],
})
export class DatabaseModule {}
