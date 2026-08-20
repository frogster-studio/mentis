import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { DatabaseModule } from "./_database/database.module";
import { CardsModule } from "./cards/modules/cards.module";
import { CatalogModule } from "./catalog/modules/catalog.module";
import { HttpErrorFilter } from "./common/http-error.filter";
import { CompetitionModule } from "./competition/modules/competition.module";
import { CoreModule } from "./core.module";
import { HealthController } from "./health/health.controller";
import { PlayerModule } from "./player/modules/player.module";

// Named RootModule: "app" is reserved vocabulary for the mobile surface here.
@Module({
  // The throttler is registered for its storage alone — the tiers live on the per-surface guards.
  imports: [
    CoreModule,
    DatabaseModule,
    ThrottlerModule.forRoot([]),
    CardsModule,
    CatalogModule,
    CompetitionModule,
    PlayerModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class RootModule {}
