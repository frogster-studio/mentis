import { type AppHistoryPageResponse, appHistoryPageResponseSchema } from "@mentis/contracts/app";
import { SessionTypeEnum } from "@mentis/contracts/enums";
import type { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import type { ThemeEntity } from "../../_database/entities/theme.entity";
import type { HistoryLine } from "../types/history-line";
import type { TimedAttempt } from "../types/timed-attempt";

export const toPracticeLine = (session: QuizSessionEntity): HistoryLine => ({
  id: session.id,
  type: SessionTypeEnum.PRACTICE,
  themeId: session.themeId,
  themeName: session.themeName,
  score: session.points,
  questionCount: session.questionCount,
  durationMs: null,
  playedAt: session.finishedAt.toISOString(),
});

// A finalized Attempt always carries its score, 0 when it expired.
export const toCompetitionLine = ({ entity, durationMs }: TimedAttempt): HistoryLine => ({
  id: entity.id,
  type: SessionTypeEnum.COMPETITION,
  themeId: entity.themeId,
  themeName: entity.themeName,
  score: entity.score ?? 0,
  questionCount: entity.questionIds.length,
  durationMs,
  playedAt: entity.issuedAt.toISOString(),
});

// A Theme the Editor deleted has no row left, so its line carries no Category.
export const toAppHistoryPageResponse = (
  page: { sessions: HistoryLine[]; nextBefore: string | null },
  catalog: ThemeEntity[],
): AppHistoryPageResponse => {
  const categories = new Map(catalog.map((theme) => [theme.id, theme.category]));
  return appHistoryPageResponseSchema.parse({
    sessions: page.sessions.map((line) => ({
      ...line,
      category: categories.get(line.themeId) ?? null,
    })),
    nextBefore: page.nextBefore,
  });
};
