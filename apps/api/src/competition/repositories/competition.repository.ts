import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import {
  CompetitionAttemptEntity,
  type CompetitionAttemptKind,
  type CompetitionFinalizeReason,
} from "../../_database/entities/competition-attempt.entity";

export type NewAttempt = {
  owner: string;
  day: string;
  kind: CompetitionAttemptKind;
  themeId: string;
  themeName: string;
  questionIds: string[];
};

export type FinalizedOutcome = {
  reason: CompetitionFinalizeReason;
  score: number;
  answers: CompetitionAnswerEntity[];
};

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
