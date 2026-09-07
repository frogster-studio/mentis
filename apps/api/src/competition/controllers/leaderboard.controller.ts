import {
  type AppCompetitionLeaderboardPageResponse,
  type AppCompetitionLeaderboardQuery,
  appCompetitionLeaderboardQuerySchema,
} from "@mentis/contracts/app";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { PublicThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CompetitionService } from "../services/competition.service";

// The Season's ranking is what a signed-out Player is shown, so this one route carries no guard.
@Controller("app/competition")
@UseGuards(PublicThrottlerGuard)
export class LeaderboardController {
  constructor(private readonly competitionService: CompetitionService) {}

  @Get("leaderboard")
  readLeaderboardPage(
    @Query(new ZodValidationPipe(appCompetitionLeaderboardQuerySchema))
    query: AppCompetitionLeaderboardQuery,
  ): Promise<AppCompetitionLeaderboardPageResponse> {
    return this.competitionService.readLeaderboardPage(query);
  }
}
