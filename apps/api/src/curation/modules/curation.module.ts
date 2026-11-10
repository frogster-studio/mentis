import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { AdminAnecdotesController } from "../controllers/admin-anecdotes.controller";
import { AdminCategoriesController } from "../controllers/admin-categories.controller";
import { AdminQuestionsController } from "../controllers/admin-questions.controller";
import { AdminThemesController } from "../controllers/admin-themes.controller";
import { CurationRepository } from "../repositories/curation.repository";
import { CurationService } from "../services/curation.service";
import { ThemeImageService } from "../services/theme-image.service";

// Catalog curation — the /admin surface, EditorGuard-bound on every route.
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([AnecdoteEntity, CategoryEntity, QuestionEntity, ThemeEntity]),
  ],
  controllers: [
    AdminAnecdotesController,
    AdminCategoriesController,
    AdminQuestionsController,
    AdminThemesController,
  ],
  providers: [CurationRepository, CurationService, ThemeImageService],
})
export class CurationModule {}
