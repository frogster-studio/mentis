import { Global, Module } from "@nestjs/common";
import { ENV, loadEnv } from "./env";
import { createServiceClient, SUPABASE } from "./supabase";

// ENV and SUPABASE are providers so tests override them through DI, not process.env.
@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: loadEnv },
    { provide: SUPABASE, useFactory: createServiceClient, inject: [ENV] },
  ],
  exports: [ENV, SUPABASE],
})
export class CoreModule {}
