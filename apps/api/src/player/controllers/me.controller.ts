import {
  type AppAccountStatsResponse,
  type AppProfileResponse,
  type AppPseudoInput,
  type AppQuizSessionPushInput,
  type AppStatBaselinePushInput,
  appPseudoInputSchema,
  appQuizSessionPushInputSchema,
  appStatBaselinePushInputSchema,
} from "@mentis/contracts/app";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Req,
  UseGuards,
} from "@nestjs/common";
import { type AuthedRequest, SupabaseUserGuard } from "../../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { PlayerService } from "../services/player.service";
import { ProfileService } from "../services/profile.service";

@Controller("app/me")
@UseGuards(SupabaseUserGuard, AuthenticatedThrottlerGuard)
export class MeController {
  constructor(
    private readonly playerService: PlayerService,
    private readonly profileService: ProfileService,
  ) {}

  // Reading the profile is what creates the default pseudo, so this never answers an empty one.
  @Get("profile")
  profile(@Req() request: AuthedRequest): Promise<AppProfileResponse> {
    return this.profileService.ensureProfile(request.user.id, request.user.claims);
  }

  @Put("pseudo")
  setPseudo(
    @Req() request: AuthedRequest,
    @Body(new ZodValidationPipe(appPseudoInputSchema)) input: AppPseudoInput,
  ): Promise<AppProfileResponse> {
    return this.profileService.setPseudo(request.user.id, input.pseudo);
  }

  @Get("stats")
  stats(@Req() request: AuthedRequest): Promise<AppAccountStatsResponse> {
    return this.playerService.stats(request.user.id);
  }

  @Post("quiz-sessions")
  @HttpCode(HttpStatus.NO_CONTENT)
  pushQuizSessions(
    @Req() request: AuthedRequest,
    @Body(new ZodValidationPipe(appQuizSessionPushInputSchema)) sessions: AppQuizSessionPushInput,
  ): Promise<void> {
    return this.playerService.pushQuizSessions(request.user.id, sessions);
  }

  @Post("stat-baselines")
  @HttpCode(HttpStatus.NO_CONTENT)
  pushStatBaselines(
    @Req() request: AuthedRequest,
    @Body(new ZodValidationPipe(appStatBaselinePushInputSchema))
    baselines: AppStatBaselinePushInput,
  ): Promise<void> {
    return this.playerService.pushStatBaselines(request.user.id, baselines);
  }

  @Delete("account")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAccount(@Req() request: AuthedRequest): Promise<void> {
    return this.playerService.deleteAccount(request.user.id);
  }
}
