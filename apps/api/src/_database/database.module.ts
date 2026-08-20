import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ENV, type Env } from "../env";
import { dataSourceOptions } from "./datasource";

// forRootAsync so the options read the ENV provider — tests override the DataSource token through DI.
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ENV],
      useFactory: (env: Env) => dataSourceOptions(env),
    }),
  ],
})
export class DatabaseModule {}
