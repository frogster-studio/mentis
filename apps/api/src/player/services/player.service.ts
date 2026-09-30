import type {
  AppAccountStatsResponse,
  AppPracticeDayPushInput,
  AppQuizSessionPushInput,
  AppStatBaselinePushInput,
} from "@mentis/contracts/app";
import { GoneException, Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../../_config/supabase.config";
import type { Clock } from "../../competition/types/clock";
import { CLOCK } from "../../competition/utils/clock";
import { competitionDay } from "../../competition/utils/competition-day";
import { toAppAccountStatsResponse } from "../mappers/player.mapper";
import { AccountGoneError, PlayerRepository } from "../repositories/player.repository";
import { latestCapturedNames } from "../utils/captured-theme-names";
import { streakFromDays } from "../utils/streak";
import { themeTallies } from "../utils/theme-tallies";

@Injectable()
export class PlayerService {
  constructor(
    private readonly playerRepository: PlayerRepository,
    @Inject(SUPABASE) private readonly supabase: SupabaseClient,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async stats(owner: string): Promise<AppAccountStatsResponse> {
    const [sessionSums, baselineSums, attempts, practiceDays, competitionDays] = await Promise.all([
      this.playerRepository.sumQuizSessionsByTheme(owner),
      this.playerRepository.sumStatBaselinesByTheme(owner),
      this.playerRepository.findCompetitionAttempts(owner),
      this.playerRepository.findPracticeDays(owner),
      this.playerRepository.findCompetitionDays(owner),
    ]);
    const practiceSums = [...sessionSums, ...baselineSums];
    const tallies = themeTallies(practiceSums, attempts, competitionDay(this.clock()));
    const catalog = await this.playerRepository.findThemesWithCategory(
      tallies.map((tally) => tally.themeId),
    );
    const capturedNames = latestCapturedNames([
      ...practiceSums,
      ...attempts.map((attempt) => ({
        themeId: attempt.themeId,
        themeName: attempt.themeName,
        capturedAt: attempt.issuedAt,
      })),
    ]);
    return toAppAccountStatsResponse(
      { tallies, catalog, capturedNames },
      {
        practiceStreak: streakFromDays(practiceDays),
        competitionStreak: streakFromDays(competitionDays),
      },
    );
  }

  async pushQuizSessions(owner: string, sessions: AppQuizSessionPushInput): Promise<void> {
    if (sessions.length === 0) {
      return;
    }
    await this.withAccountGoneEnvelope(() =>
      this.playerRepository.insertQuizSessionsIfAbsent(
        sessions.map((session) => ({
          id: session.id,
          owner,
          themeId: session.themeId,
          themeName: session.themeName,
          points: session.points,
          questionCount: session.questionCount,
          finishedAt: new Date(session.finishedAt),
        })),
      ),
    );
  }

  async pushStatBaselines(owner: string, baselines: AppStatBaselinePushInput): Promise<void> {
    if (baselines.length === 0) {
      return;
    }
    await this.withAccountGoneEnvelope(() =>
      this.playerRepository.insertStatBaselinesIfAbsent(
        baselines.map((baseline) => ({
          owner,
          device: baseline.device,
          themeId: baseline.themeId,
          themeName: baseline.themeName,
          totalPoints: baseline.totalPoints,
          sessionCount: baseline.sessionCount,
          bestScore: baseline.bestScore,
        })),
      ),
    );
  }

  async pushPracticeDays(owner: string, practiceDays: AppPracticeDayPushInput): Promise<void> {
    if (practiceDays.length === 0) {
      return;
    }
    await this.withAccountGoneEnvelope(() =>
      this.playerRepository.insertPracticeDaysIfAbsent(
        practiceDays.map((practiceDay) => ({
          owner,
          device: practiceDay.device,
          day: practiceDay.day,
        })),
      ),
    );
  }

  async deleteAccount(owner: string): Promise<void> {
    // Deleting the auth row cascades every player table through its owner FK.
    const { error } = await this.supabase.auth.admin.deleteUser(owner);
    if (error) {
      throw new Error(`account deletion failed: ${error.message}`);
    }
  }

  private async withAccountGoneEnvelope(insert: () => Promise<void>): Promise<void> {
    try {
      await insert();
    } catch (error) {
      if (error instanceof AccountGoneError) {
        throw new GoneException({ code: "ACCOUNT_GONE", message: "This account no longer exists" });
      }
      throw error;
    }
  }
}
