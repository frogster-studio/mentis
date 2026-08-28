import {
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  adminQuestionListQuerySchema,
} from "@mentis/contracts/admin";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CurationService } from "../services/curation.service";

@Controller("admin/questions")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminQuestionsController {
  constructor(private readonly curationService: CurationService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminQuestionListQuerySchema)) query: AdminQuestionListQuery,
  ): Promise<AdminQuestionListResponse> {
    return this.curationService.listQuestions(query);
  }
}
