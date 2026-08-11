import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { HttpErrorFilter } from "./common/http-error.filter";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";

// Named RootModule: "app" is reserved vocabulary for the mobile surface here.
@Module({
  imports: [CoreModule],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class RootModule {}
