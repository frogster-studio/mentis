import { Module } from "@nestjs/common";
import { CompetitionController } from "./competition.controller";
import { MeController } from "./me.controller";
import { QuestionsController } from "./questions.controller";
import { ThemesController } from "./themes.controller";

// The /app surface: public Quiz play reads, plus the SupabaseUserGuard-bound Player routes.
@Module({
  controllers: [CompetitionController, MeController, QuestionsController, ThemesController],
})
export class AppModule {}
