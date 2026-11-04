import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { AnecdotesController } from "../controllers/anecdotes.controller";
import { QuestionsController } from "../controllers/questions.controller";
import { ThemesController } from "../controllers/themes.controller";
import { AnecdoteRepository } from "../repositories/anecdote.repository";
import { CatalogRepository } from "../repositories/catalog.repository";
import { AnecdoteService } from "../services/anecdote.service";
import { CatalogService } from "../services/catalog.service";

// Quiz-play content — the public /app reads, the only door onto a Theme, Question or Anecdote row.
@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([AnecdoteEntity, QuestionEntity, ThemeEntity])],
  controllers: [AnecdotesController, QuestionsController, ThemesController],
  providers: [AnecdoteRepository, AnecdoteService, CatalogRepository, CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
