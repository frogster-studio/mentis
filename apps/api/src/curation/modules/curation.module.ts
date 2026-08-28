import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { AdminCategoriesController } from "../controllers/admin-categories.controller";
import { AdminQuestionsController } from "../controllers/admin-questions.controller";
import { AdminThemesController } from "../controllers/admin-themes.controller";
import { CurationRepository } from "../repositories/curation.repository";
import { CurationService } from "../services/curation.service";

// Catalog curation — the /admin surface, EditorGuard-bound on every route.
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([CategoryEntity, QuestionEntity, ThemeEntity])],
  controllers: [AdminCategoriesController, AdminQuestionsController, AdminThemesController],
  providers: [CurationRepository, CurationService],
})
export class CurationModule {}
