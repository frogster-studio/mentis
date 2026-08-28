import {
  type AdminQuestionListQuery,
  type AdminQuestionListResponse,
  type AdminQuestionResponse,
  type AdminQuestionStaging,
  type AdminQuestionWrite,
  adminQuestionIdSchema,
  adminQuestionListQuerySchema,
  adminQuestionStagingSchema,
  adminQuestionWriteSchema,
} from "@mentis/contracts/admin";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
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

  @Post()
  create(
    @Body(new ZodValidationPipe(adminQuestionWriteSchema)) question: AdminQuestionWrite,
  ): Promise<AdminQuestionResponse> {
    return this.curationService.createQuestion(question);
  }

  @Patch(":id")
  update(
    @Param("id", new ZodValidationPipe(adminQuestionIdSchema)) id: string,
    @Body(new ZodValidationPipe(adminQuestionWriteSchema)) question: AdminQuestionWrite,
  ): Promise<AdminQuestionResponse> {
    return this.curationService.updateQuestion(id, question);
  }

  @Patch(":id/staging")
  stage(
    @Param("id", new ZodValidationPipe(adminQuestionIdSchema)) id: string,
    @Body(new ZodValidationPipe(adminQuestionStagingSchema)) staging: AdminQuestionStaging,
  ): Promise<AdminQuestionResponse> {
    return this.curationService.stageQuestion(id, staging);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param("id", new ZodValidationPipe(adminQuestionIdSchema)) id: string): Promise<void> {
    return this.curationService.deleteQuestion(id);
  }
}
