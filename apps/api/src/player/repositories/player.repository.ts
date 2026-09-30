import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  type DeepPartial,
  In,
  type InsertResult,
  LessThan,
  QueryFailedError,
  Repository,
  type SelectQueryBuilder,
} from "typeorm";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { PracticeDayEntity } from "../../_database/entities/practice-day.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import type { CapturedThemeName } from "../types/captured-theme-name";
import type { PracticeSum } from "../types/practice-sum";
import type { TimedAttempt } from "../types/timed-attempt";

const OWNER_FK_VIOLATION = "23503";

export class AccountGoneError extends Error {}

const isoDate = (expression: string): string => `to_char(${expression}, 'YYYY-MM-DD')`;

type RawPracticeSum = {
  themeId: string;
  sessionCount: string;
  totalPoints: string;
  bestScore: number | null;
  themeName: string;
  capturedAt: Date | string;
};

// Postgres answers count and sum as bigint, which the driver hands over as a string.
const practiceSumsOf = async <Entity extends object>(
  query: SelectQueryBuilder<Entity>,
): Promise<(PracticeSum & CapturedThemeName)[]> => {
  const rows = await query.getRawMany<RawPracticeSum>();
  return rows.map((row) => ({
    themeId: row.themeId,
    sessionCount: Number(row.sessionCount),
    totalPoints: Number(row.totalPoints),
    bestScore: row.bestScore,
    themeName: row.themeName,
    capturedAt: new Date(row.capturedAt),
  }));
};

const isOwnerFkViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string } | undefined)?.code === OWNER_FK_VIOLATION;

@Injectable()
export class PlayerRepository {
  constructor(
    @InjectRepository(QuizSessionEntity) private readonly sessions: Repository<QuizSessionEntity>,
    @InjectRepository(StatBaselineEntity)
    private readonly baselines: Repository<StatBaselineEntity>,
    @InjectRepository(PracticeDayEntity)
    private readonly practiceDays: Repository<PracticeDayEntity>,
    @InjectRepository(CompetitionAttemptEntity)
    private readonly attempts: Repository<CompetitionAttemptEntity>,
    @InjectRepository(ThemeEntity) private readonly themes: Repository<ThemeEntity>,
  ) {}

  sumQuizSessionsByTheme(owner: string): Promise<(PracticeSum & CapturedThemeName)[]> {
    return practiceSumsOf(
      this.sessions
        .createQueryBuilder("session")
        .select("session.themeId", "themeId")
        .addSelect("count(session.id)", "sessionCount")
        .addSelect("sum(session.points)", "totalPoints")
        .addSelect("max(session.points)", "bestScore")
        .addSelect(
          "(array_agg(session.themeName ORDER BY session.finishedAt DESC))[1]",
          "themeName",
        )
        .addSelect("max(session.finishedAt)", "capturedAt")
        .where("session.owner = :owner", { owner })
        .groupBy("session.themeId"),
    );
  }

  sumStatBaselinesByTheme(owner: string): Promise<(PracticeSum & CapturedThemeName)[]> {
    return practiceSumsOf(
      this.baselines
        .createQueryBuilder("baseline")
        .select("baseline.themeId", "themeId")
        .addSelect("sum(baseline.sessionCount)", "sessionCount")
        .addSelect("sum(baseline.totalPoints)", "totalPoints")
        .addSelect("max(baseline.bestScore)", "bestScore")
        .addSelect(
          "(array_agg(baseline.themeName ORDER BY baseline.createdAt DESC))[1]",
          "themeName",
        )
        .addSelect("max(baseline.createdAt)", "capturedAt")
        .where("baseline.owner = :owner", { owner })
        .groupBy("baseline.themeId"),
    );
  }

  findCompetitionAttempts(owner: string): Promise<CompetitionAttemptEntity[]> {
    return this.attempts.find({ where: { owner } });
  }

  findQuizSessionsBefore(
    owner: string,
    before: Date | null,
    limit: number,
  ): Promise<QuizSessionEntity[]> {
    return this.sessions.find({
      where: before === null ? { owner } : { owner, finishedAt: LessThan(before) },
      order: { finishedAt: "DESC" },
      take: limit,
    });
  }

  // An active Attempt has no score yet, so only a finalized one is a line of the History.
  async findFinalizedAttemptsBefore(
    owner: string,
    before: Date | null,
    limit: number,
  ): Promise<TimedAttempt[]> {
    const query = this.attempts
      .createQueryBuilder("attempt")
      .leftJoin(CompetitionAnswerEntity, "answer", "answer.attemptId = attempt.id")
      .addSelect("sum(answer.clientElapsedMs)", "durationMs")
      .where("attempt.owner = :owner", { owner })
      .andWhere("attempt.status = :status", { status: "finalized" })
      // Grouping on the primary key carries every other Attempt column with it.
      .groupBy("attempt.id")
      .orderBy("attempt.issuedAt", "DESC")
      .limit(limit);
    if (before !== null) {
      query.andWhere("attempt.issuedAt < :before", { before });
    }
    const { entities, raw } = await query.getRawAndEntities<{ durationMs: string | null }>();

    return entities.map((entity, index) => {
      const { durationMs } = raw[index];
      return { entity, durationMs: durationMs === null ? null : Number(durationMs) };
    });
  }

  // Published or not: a Theme the Player has played keeps its row once withdrawn.
  async findThemesWithCategory(themeIds: string[]): Promise<ThemeEntity[]> {
    if (themeIds.length === 0) {
      return [];
    }
    return this.themes.find({ where: { id: In(themeIds) }, relations: { category: true } });
  }

  // A Streak day is the Europe/Paris date, whatever the Player's own timezone.
  async findPracticeDays(owner: string): Promise<string[]> {
    const [finishedDays, depositedDays] = await Promise.all([
      this.sessions
        .createQueryBuilder("session")
        .select(`DISTINCT ${isoDate("session.finishedAt AT TIME ZONE 'Europe/Paris'")}`, "day")
        .where("session.owner = :owner", { owner })
        .getRawMany<{ day: string }>(),
      this.practiceDays
        .createQueryBuilder("practiceDay")
        .select(`DISTINCT ${isoDate("practiceDay.day")}`, "day")
        .where("practiceDay.owner = :owner", { owner })
        .getRawMany<{ day: string }>(),
    ]);
    return [...new Set([...finishedDays, ...depositedDays].map((row) => row.day))];
  }

  // Every Attempt counts, whatever its status, so a quit or expired day still holds the Streak.
  async findCompetitionDays(owner: string): Promise<string[]> {
    const rows = await this.attempts
      .createQueryBuilder("attempt")
      .select(`DISTINCT ${isoDate("attempt.day")}`, "day")
      .where("attempt.owner = :owner", { owner })
      .getRawMany<{ day: string }>();
    return rows.map((row) => row.day);
  }

  async insertQuizSessionsIfAbsent(rows: DeepPartial<QuizSessionEntity>[]): Promise<void> {
    await this.insertIfAbsent(() =>
      this.sessions.createQueryBuilder().insert().values(rows).orIgnore().execute(),
    );
  }

  async insertStatBaselinesIfAbsent(rows: DeepPartial<StatBaselineEntity>[]): Promise<void> {
    await this.insertIfAbsent(() =>
      this.baselines.createQueryBuilder().insert().values(rows).orIgnore().execute(),
    );
  }

  async insertPracticeDaysIfAbsent(rows: DeepPartial<PracticeDayEntity>[]): Promise<void> {
    await this.insertIfAbsent(() =>
      this.practiceDays.createQueryBuilder().insert().values(rows).orIgnore().execute(),
    );
  }

  // Never overwrite: a re-push is a no-op success and a row another Player owns is left alone.
  private async insertIfAbsent(insert: () => Promise<InsertResult>): Promise<void> {
    try {
      await insert();
    } catch (error) {
      // The owner FK is gone, so the Account was deleted while these rows waited in the outbox.
      if (isOwnerFkViolation(error)) {
        throw new AccountGoneError();
      }
      throw error;
    }
  }
}
