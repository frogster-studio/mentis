import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { AdminModule } from "./admin/admin.module";
import { AppSurfaceModule } from "./app/app-surface.module";
import { HttpErrorFilter } from "./common/http-error.filter";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";

// Named RootModule: "app" is reserved vocabulary for the mobile surface here.
@Module({
  imports: [
    CoreModule,
    // Railway does no edge rate limiting; generous global per-IP cap (research #5).
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }] }),
    AdminModule,
    AppSurfaceModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpErrorFilter },
  ],
})
export class RootModule {}
