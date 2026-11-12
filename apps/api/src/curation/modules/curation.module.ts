import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { raw } from "express";
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
import { AnecdoteImageService } from "../services/anecdote-image.service";
import { CurationService } from "../services/curation.service";
import { ThemeImageService } from "../services/theme-image.service";

export const ANECDOTE_IMAGE_BODY_LIMIT = 153_600;

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
  providers: [AnecdoteImageService, CurationRepository, CurationService, ThemeImageService],
})
export class CurationModule implements NestModule {
  // The Anecdote Image route alone reads raw bytes, whatever their label: its own header decides.
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(raw({ type: () => true, limit: ANECDOTE_IMAGE_BODY_LIMIT }))
      .forRoutes({ path: "admin/anecdotes/:id/image", method: RequestMethod.PUT });
  }
}
