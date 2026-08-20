import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CatalogModule } from "../../catalog/modules/catalog.module";
import { CompetitionController } from "../controllers/competition.controller";
import { CompetitionRepository } from "../repositories/competition.repository";
import { CompetitionService } from "../services/competition.service";

// The daily Attempt — drawn through the Catalog, never reading a Theme or Question itself.
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CompetitionAttemptEntity, CompetitionAnswerEntity]),
    CatalogModule,
  ],
  controllers: [CompetitionController],
  providers: [CompetitionRepository, CompetitionService],
})
export class CompetitionModule {}
