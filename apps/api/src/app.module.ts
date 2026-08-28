import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule } from "./_config/config.module";
import { DatabaseModule } from "./_database/database.module";
import { CatalogModule } from "./catalog/modules/catalog.module";
import { HttpErrorFilter } from "./common/http-error.filter";
import { CompetitionModule } from "./competition/modules/competition.module";
import { CurationModule } from "./curation/modules/curation.module";
import { HealthController } from "./health/health.controller";
import { PlayerModule } from "./player/modules/player.module";

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    ThrottlerModule.forRoot([]),
    CatalogModule,
    CompetitionModule,
    CurationModule,
    PlayerModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_FILTER, useClass: HttpErrorFilter }],
})
export class AppModule {}
