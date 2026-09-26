import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type DeepPartial, type InsertResult, QueryFailedError, Repository } from "typeorm";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { PracticeDayEntity } from "../../_database/entities/practice-day.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";

const OWNER_FK_VIOLATION = "23503";

export class AccountGoneError extends Error {}

const isoDate = (expression: string): string => `to_char(${expression}, 'YYYY-MM-DD')`;

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
  ) {}

  // Oldest-first: the client fold takes the most recently captured Theme name from the last row.
  findQuizSessions(owner: string): Promise<QuizSessionEntity[]> {
    return this.sessions.find({ where: { owner }, order: { finishedAt: "ASC" } });
  }

  findStatBaselines(owner: string): Promise<StatBaselineEntity[]> {
    return this.baselines.find({ where: { owner } });
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
