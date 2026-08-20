import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CatalogModule } from "../../catalog/modules/catalog.module";
import { CompetitionController } from "../controllers/competition.controller";
import { CompetitionRepository } from "../repositories/competition.repository";
import { CompetitionService } from "../services/competition.service";

// The daily Attempt — drawn through the Catalog, never reading a Theme or Question itself.
@Module({
  imports: [TypeOrmModule.forFeature([CompetitionAttemptEntity]), CatalogModule],
  controllers: [CompetitionController],
  providers: [CompetitionRepository, CompetitionService],
})
export class CompetitionModule {}
