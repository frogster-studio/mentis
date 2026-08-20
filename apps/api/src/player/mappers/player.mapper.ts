import { type AppAccountStatsResponse, appAccountStatsResponseSchema } from "@mentis/contracts/app";
import type { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import type { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";

// Parsing through the contract is what keeps owner and finishedAt off the wire.
export const toAppAccountStatsResponse = (
  baselines: StatBaselineEntity[],
  sessions: QuizSessionEntity[],
): AppAccountStatsResponse =>
  appAccountStatsResponseSchema.parse({
    baselines: baselines.map((baseline) => ({
      themeId: baseline.themeId,
      themeName: baseline.themeName,
      totalPoints: baseline.totalPoints,
      sessionCount: baseline.sessionCount,
    })),
    sessions: sessions.map((session) => ({
      id: session.id,
      themeId: session.themeId,
      themeName: session.themeName,
      points: session.points,
    })),
  });
