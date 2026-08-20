import { Module } from "@nestjs/common";
import { createProjectJwks, JWKS } from "../auth/jwks";
import { ENV, loadEnv } from "./env.config";
import { createServiceClient, SUPABASE } from "./supabase.config";

// ENV, SUPABASE and JWKS are providers so tests override them through DI, not process.env.
@Module({
  providers: [
    { provide: ENV, useFactory: loadEnv },
    { provide: SUPABASE, useFactory: createServiceClient, inject: [ENV] },
    { provide: JWKS, useFactory: createProjectJwks, inject: [ENV] },
  ],
  exports: [ENV, SUPABASE, JWKS],
})
export class ConfigModule {}
