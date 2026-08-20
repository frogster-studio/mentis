import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { type InsertResult, QueryFailedError, Repository } from "typeorm";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";

const OWNER_FK_VIOLATION = "23503";

export class AccountGoneError extends Error {}

const isOwnerFkViolation = (error: unknown): boolean =>
  error instanceof QueryFailedError &&
  (error.driverError as { code?: string } | undefined)?.code === OWNER_FK_VIOLATION;

@Injectable()
export class PlayerRepository {
  constructor(
    @InjectRepository(QuizSessionEntity) private readonly sessions: Repository<QuizSessionEntity>,
    @InjectRepository(StatBaselineEntity)
    private readonly baselines: Repository<StatBaselineEntity>,
  ) {}

  // Oldest-first: the client fold takes the most recently captured Theme name from the last row.
  findQuizSessions(owner: string): Promise<QuizSessionEntity[]> {
    return this.sessions.find({ where: { owner }, order: { finishedAt: "ASC" } });
  }

  findStatBaselines(owner: string): Promise<StatBaselineEntity[]> {
    return this.baselines.find({ where: { owner } });
  }

  async insertQuizSessionsIfAbsent(rows: QuizSessionEntity[]): Promise<void> {
    await this.insertIfAbsent(() =>
      this.sessions.createQueryBuilder().insert().values(rows).orIgnore().execute(),
    );
  }

  async insertStatBaselinesIfAbsent(rows: StatBaselineEntity[]): Promise<void> {
    await this.insertIfAbsent(() =>
      this.baselines.createQueryBuilder().insert().values(rows).orIgnore().execute(),
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
