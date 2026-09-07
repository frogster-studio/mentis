import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CatalogModule } from "../../catalog/modules/catalog.module";
import { PlayerModule } from "../../player/modules/player.module";
import { PremiumModule } from "../../premium/modules/premium.module";
import { CompetitionController } from "../controllers/competition.controller";
import { LeaderboardController } from "../controllers/leaderboard.controller";
import { CompetitionRepository } from "../repositories/competition.repository";
import { CompetitionService } from "../services/competition.service";
import { CLOCK, systemClock } from "../utils/clock";

// The daily Attempt — drawn through the Catalog, gated through Premium, named through Player, owning none.
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CompetitionAttemptEntity, CompetitionAnswerEntity]),
    CatalogModule,
    PremiumModule,
    PlayerModule,
  ],
  controllers: [CompetitionController, LeaderboardController],
  providers: [CompetitionRepository, CompetitionService, { provide: CLOCK, useValue: systemClock }],
})
export class CompetitionModule {}
