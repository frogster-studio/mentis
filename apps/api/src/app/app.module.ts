import { Module } from "@nestjs/common";
import { MeController } from "./me.controller";

// The /app surface's SupabaseUserGuard-bound Player routes.
@Module({
  controllers: [MeController],
})
export class AppModule {}
