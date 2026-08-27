import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { QuestionsController } from "../controllers/questions.controller";
import { ThemesController } from "../controllers/themes.controller";
import { CatalogRepository } from "../repositories/catalog.repository";
import { CatalogService } from "../services/catalog.service";

// Quiz-play content — the public /app reads, and the only door onto a Theme or Question row.
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([QuestionEntity, ThemeEntity])],
  controllers: [QuestionsController, ThemesController],
  providers: [CatalogRepository, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
