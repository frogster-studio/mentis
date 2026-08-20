import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./_database/database.module";
import { AdminModule } from "./admin/admin.module";
import { AppModule } from "./app/app.module";
import { HttpErrorFilter } from "./common/http-error.filter";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";

// Named RootModule: "app" is reserved vocabulary for the mobile surface here.
@Module({
  // The throttler is registered for its storage alone — the tiers live on the per-surface guards.
  imports: [CoreModule, DatabaseModule, ThrottlerModule.forRoot([]), AdminModule, AppModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class RootModule {}
