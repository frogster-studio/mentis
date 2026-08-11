import {
  type AppAccountStatsResponse,
  type AppQuizSessionPushInput,
  type AppStatBaselinePushInput,
  appAccountStatsResponseSchema,
  appQuizSessionPushInputSchema,
  appStatBaselinePushInputSchema,
} from "@mentis/contracts/app";
import {
  Body,
  Controller,
  Delete,
  Get,
  GoneException,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";
import { type AuthedRequest, SupabaseUserGuard } from "../auth/supabase-user.guard";
import { AuthenticatedThrottlerGuard } from "../common/rate-limit.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { SUPABASE } from "../supabase";

const BASELINE_SELECT =
  "themeId:theme_id, themeName:theme_name, totalPoints:total_points, sessionCount:session_count";
const SESSION_SELECT = "id, themeId:theme_id, themeName:theme_name, points";

// The Account was deleted mid-queue, and mobile's outbox discards its rows on this code alone.
const OWNER_FK_VIOLATION = "23503";

@Controller("app/me")
@UseGuards(SupabaseUserGuard, AuthenticatedThrottlerGuard)
export class MeController {
  constructor(@Inject(SUPABASE) private readonly supabase: SupabaseClient) {}

  @Get("stats")
  async stats(@Req() request: AuthedRequest): Promise<AppAccountStatsResponse> {
    const owner = request.user.id;
    const [baselines, sessions] = await Promise.all([
      this.supabase.from("stat_baselines").select(BASELINE_SELECT).eq("owner", owner),
      // Oldest-first: the client fold takes the most recently captured Theme name from the last row.
      this.supabase
        .from("quiz_sessions")
        .select(SESSION_SELECT)
        .eq("owner", owner)
        .order("finished_at", { ascending: true }),
    ]);
    if (baselines.error) {
      throw new Error(`stat_baselines select failed: ${baselines.error.message}`);
    }
    if (sessions.error) {
      throw new Error(`quiz_sessions select failed: ${sessions.error.message}`);
    }
    return appAccountStatsResponseSchema.parse({
      baselines: baselines.data ?? [],
      sessions: sessions.data ?? [],
    });
  }

  @Post("quiz-sessions")
  @HttpCode(HttpStatus.NO_CONTENT)
  async pushQuizSessions(
    @Req() request: AuthedRequest,
    @Body(new ZodValidationPipe(appQuizSessionPushInputSchema)) sessions: AppQuizSessionPushInput,
  ): Promise<void> {
    if (sessions.length === 0) {
      return;
    }
    const owner = request.user.id;
    await this.insertIfAbsent(
      "quiz_sessions",
      "id",
      sessions.map((session) => ({
        id: session.id,
        owner,
        theme_id: session.themeId,
        theme_name: session.themeName,
        points: session.points,
        finished_at: session.finishedAt,
      })),
    );
  }

  @Post("stat-baselines")
  @HttpCode(HttpStatus.NO_CONTENT)
  async pushStatBaselines(
    @Req() request: AuthedRequest,
    @Body(new ZodValidationPipe(appStatBaselinePushInputSchema))
    baselines: AppStatBaselinePushInput,
  ): Promise<void> {
    if (baselines.length === 0) {
      return;
    }
    const owner = request.user.id;
    await this.insertIfAbsent(
      "stat_baselines",
      "owner,device,theme_id",
      baselines.map((baseline) => ({
        owner,
        device: baseline.device,
        theme_id: baseline.themeId,
        theme_name: baseline.themeName,
        total_points: baseline.totalPoints,
        session_count: baseline.sessionCount,
      })),
    );
  }

  @Delete("account")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAccount(@Req() request: AuthedRequest): Promise<void> {
    // Deleting the auth row cascades both player tables through their owner FK.
    const { error } = await this.supabase.auth.admin.deleteUser(request.user.id);
    if (error) {
      throw new Error(`account deletion failed: ${error.message}`);
    }
  }

  // Never overwrite: a re-push is a no-op success and a row another Player owns is left alone.
  private async insertIfAbsent(
    table: string,
    onConflict: string,
    rows: Record<string, unknown>[],
  ): Promise<void> {
    const { error }: { error: PostgrestError | null } = await this.supabase
      .from(table)
      .upsert(rows, { onConflict, ignoreDuplicates: true });
    if (error === null) {
      return;
    }
    if (error.code === OWNER_FK_VIOLATION) {
      throw new GoneException({ code: "ACCOUNT_GONE", message: "This account no longer exists" });
    }
    throw new Error(`${table} push failed: ${error.message}`);
  }
}
