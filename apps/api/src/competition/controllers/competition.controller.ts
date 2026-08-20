import type { AppCompetitionAttemptResponse } from "@mentis/contracts/app";
import { Controller, HttpCode, HttpStatus, Post, Req, UseGuards } from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "../../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
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
}
