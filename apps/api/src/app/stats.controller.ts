import type { AppAccountStatsResponse } from "@mentis/contracts/app";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "../auth/supabase-user.guard";
import { StatsService } from "./stats.service";

@Controller("app/me")
@UseGuards(SupabaseUserGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get("stats")
  stats(@Req() request: AuthedRequest): Promise<AppAccountStatsResponse> {
    return this.statsService.forOwner(request.user.id);
  }
}
