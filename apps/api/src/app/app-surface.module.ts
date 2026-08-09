import { Module } from "@nestjs/common";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

// The /app/* surface: called directly by mobile; /app/me/* is JWT-guarded,
// the rest is public (#6). Named "app surface" because the root Nest module
// already owns the AppModule idiom.
@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class AppSurfaceModule {}
