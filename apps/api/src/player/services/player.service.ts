import type {
  AppAccountStatsResponse,
  AppQuizSessionPushInput,
  AppStatBaselinePushInput,
} from "@mentis/contracts/app";
import { GoneException, Inject, Injectable } from "@nestjs/common";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE } from "../../supabase";
import { toAppAccountStatsResponse } from "../mappers/player.mapper";
import { AccountGoneError, PlayerRepository } from "../repositories/player.repository";

@Injectable()
export class PlayerService {
  constructor(
    private readonly playerRepository: PlayerRepository,
    @Inject(SUPABASE) private readonly supabase: SupabaseClient,
  ) {}

  async stats(owner: string): Promise<AppAccountStatsResponse> {
    const [baselines, sessions] = await Promise.all([
      this.playerRepository.findStatBaselines(owner),
      this.playerRepository.findQuizSessions(owner),
    ]);
    return toAppAccountStatsResponse(baselines, sessions);
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
        })),
      ),
    );
  }

  async deleteAccount(owner: string): Promise<void> {
    // Deleting the auth row cascades both player tables through their owner FK.
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
