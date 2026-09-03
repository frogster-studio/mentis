import type { AppPremiumResponse } from "@mentis/contracts/app";
import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "../../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { PremiumService } from "../services/premium.service";

@Controller("app/me/premium")
@UseGuards(SupabaseUserGuard, AuthenticatedThrottlerGuard)
export class PremiumController {
  constructor(private readonly premiumService: PremiumService) {}

  @Get()
  read(@Req() request: AuthedRequest): Promise<AppPremiumResponse> {
    return this.premiumService.read(request.user.id);
  }
}
