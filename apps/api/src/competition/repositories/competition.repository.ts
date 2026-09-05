import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import {
  CompetitionAttemptEntity,
  type CompetitionAttemptKind,
} from "../../_database/entities/competition-attempt.entity";
import type { DayScore } from "../types/day-score";
import type { FinalizedOutcome } from "../types/finalized-outcome";
import type { NewAttempt } from "../types/new-attempt";

@Injectable()
export class CompetitionRepository {
  constructor(
    @InjectRepository(CompetitionAttemptEntity)
    private readonly attempts: Repository<CompetitionAttemptEntity>,
    @InjectRepository(CompetitionAnswerEntity)
    private readonly answers: Repository<CompetitionAnswerEntity>,
  ) {}

  findAttempt(
    owner: string,
    day: string,
    kind: CompetitionAttemptKind,
  ): Promise<CompetitionAttemptEntity | null> {
    return this.attempts.findOneBy({ owner, day, kind });
  }

  findOwnedAttempt(id: string, owner: string): Promise<CompetitionAttemptEntity | null> {
    return this.attempts.findOneBy({ id, owner });
  }

  findAttemptsOnDay(owner: string, day: string): Promise<CompetitionAttemptEntity[]> {
    return this.attempts.find({ where: { owner, day }, order: { issuedAt: "ASC" } });
  }

  // Newest first: the Attempt the Player is on leads, and any older one below it is a dead day.
  findActiveAttempts(owner: string): Promise<CompetitionAttemptEntity[]> {
    return this.attempts.find({ where: { owner, status: "active" }, order: { issuedAt: "DESC" } });
  }

  findAnswers(attemptId: string): Promise<CompetitionAnswerEntity[]> {
    return this.answers.find({ where: { attemptId }, order: { position: "ASC" } });
  }

  async themeIdsPlayedBetween(owner: string, from: string, to: string): Promise<string[]> {
    const rows = await this.attempts.find({
      where: { owner, day: Between(from, to) },
      select: { themeId: true },
    });
    return rows.map((row) => row.themeId);
  }

  // A day scores its best Attempt, so every finalized row the season holds is a candidate.
  async findFinalizedDayScores(owner: string, from: string, to: string): Promise<DayScore[]> {
    const rows = await this.attempts.find({
      where: { owner, status: "finalized", day: Between(from, to) },
      select: { day: true, score: true },
    });
    return rows.map((row) => ({ day: row.day, score: row.score ?? 0 }));
  }

  // ON CONFLICT DO NOTHING: an empty return means another device won the day's single Attempt.
  async issue(attempt: NewAttempt): Promise<CompetitionAttemptEntity | null> {
    const { raw } = await this.attempts
      .createQueryBuilder()
      .insert()
      .values(attempt)
      .orIgnore()
      .returning("id")
      .execute();
    const [inserted] = raw as { id: string }[];
    if (inserted === undefined) {
      return null;
    }
    return this.attempts.findOneByOrFail({ id: inserted.id });
  }

  // Claiming the still-active row is the lock: a second finalize writes nothing and reads back.
  async finalize(
    attemptId: string,
    outcome: FinalizedOutcome,
  ): Promise<CompetitionAttemptEntity | null> {
    return this.attempts.manager.transaction(async (manager) => {
      const claimed = await manager
        .createQueryBuilder()
        .update(CompetitionAttemptEntity)
        .set({
          status: "finalized",
          finalizeReason: outcome.reason,
          score: outcome.score,
          finalizedAt: () => "now()",
        })
        .where("id = :attemptId and status = 'active'", { attemptId })
        .execute();
      if (claimed.affected !== 1) {
        return null;
      }
      await manager
        .createQueryBuilder()
        .insert()
        .into(CompetitionAnswerEntity)
        .values(outcome.answers)
        .execute();
      return manager.findOneByOrFail(CompetitionAttemptEntity, { id: attemptId });
    });
  }
}
