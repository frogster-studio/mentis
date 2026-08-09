import { Global, Module } from "@nestjs/common";
import { ENV, loadEnv } from "./env";
import { createServiceClient, SUPABASE } from "./supabase";

// ENV is a provider so tests can override it through DI instead of mutating
// process.env; SUPABASE rides on it the same way.
@Global()
@Module({
  providers: [
    { provide: ENV, useFactory: loadEnv },
    { provide: SUPABASE, useFactory: createServiceClient, inject: [ENV] },
  ],
  exports: [ENV, SUPABASE],
})
export class CoreModule {}
