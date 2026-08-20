import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionFinalizeInput,
  type AppCompetitionTranscriptResponse,
  appCompetitionAttemptIdSchema,
  appCompetitionFinalizeInputSchema,
} from "@mentis/contracts/app";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "../../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CompetitionService } from "../services/competition.service";

@Controller("app/me/competition")
@UseGuards(SupabaseUserGuard, AuthenticatedThrottlerGuard)
export class CompetitionController {
  constructor(private readonly competitionService: CompetitionService) {}

  // A Competition Day holds one initial Attempt, so asking twice reads the first back — never a 201.
  @Post("attempts")
  @HttpCode(HttpStatus.OK)
  issueInitialAttempt(@Req() request: AuthedRequest): Promise<AppCompetitionAttemptResponse> {
    return this.competitionService.issueInitialAttempt(request.user.id);
  }

  // A crashed session resumes here: the Questions as issued, none of the answers played.
  @Get("attempts/active")
  readActiveAttempt(@Req() request: AuthedRequest): Promise<AppCompetitionActiveAttemptResponse> {
    return this.competitionService.readActiveAttempt(request.user.id);
  }

  // Idempotent, so the outbox re-sends freely: a finalized Attempt hands back the stored transcript.
  @Post("attempts/:attemptId/finalize")
  @HttpCode(HttpStatus.OK)
  finalizeAttempt(
    @Req() request: AuthedRequest,
    @Param("attemptId", new ZodValidationPipe(appCompetitionAttemptIdSchema)) attemptId: string,
    @Body(new ZodValidationPipe(appCompetitionFinalizeInputSchema))
    batch: AppCompetitionFinalizeInput,
  ): Promise<AppCompetitionTranscriptResponse> {
    return this.competitionService.finalizeAttempt(request.user.id, attemptId, batch);
  }
}
