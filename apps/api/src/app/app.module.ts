import { Module } from "@nestjs/common";
import { QuestionsController } from "./questions.controller";
import { ThemesController } from "./themes.controller";

// The /app surface: public Quiz play reads, no Authorization header ever read.
@Module({ controllers: [QuestionsController, ThemesController] })
export class AppModule {}
