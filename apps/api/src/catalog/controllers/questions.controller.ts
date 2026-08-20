import {
  type AppQuestionDrawQuery,
  type AppQuestionDrawResponse,
  appQuestionDrawQuerySchema,
} from "@mentis/contracts/app";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DrawThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CatalogService } from "../services/catalog.service";

@Controller("app/questions")
@UseGuards(DrawThrottlerGuard)
export class QuestionsController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  draw(
    @Query(new ZodValidationPipe(appQuestionDrawQuerySchema)) query: AppQuestionDrawQuery,
  ): Promise<AppQuestionDrawResponse> {
    return this.catalogService.drawQuestions(query);
  }
}
