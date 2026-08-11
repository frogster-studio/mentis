import { Global, Module } from "@nestjs/common";
import { createProjectJwks, JWKS } from "./auth/jwks";
import { ENV, loadEnv } from "./env";
import { createServiceClient, SUPABASE } from "./supabase";

// ENV, SUPABASE and JWKS are providers so tests override them through DI, not process.env.
@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: loadEnv },
    { provide: SUPABASE, useFactory: createServiceClient, inject: [ENV] },
    { provide: JWKS, useFactory: createProjectJwks, inject: [ENV] },
  ],
  exports: [ENV, SUPABASE, JWKS],
})
export class CoreModule {}
