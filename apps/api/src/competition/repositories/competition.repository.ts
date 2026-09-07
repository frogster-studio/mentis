import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, EntityManager, Repository } from "typeorm";
import { AuthUserEntity } from "../../_database/entities/auth-user.entity";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import {
  CompetitionAttemptEntity,
  type CompetitionAttemptKind,
} from "../../_database/entities/competition-attempt.entity";
import { CompetitionStandingEntity } from "../../_database/entities/competition-standing.entity";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import type { FinalizedOutcome } from "../types/finalized-outcome";
import type { NewAttempt } from "../types/new-attempt";
import { seasonBounds, seasonTotal } from "../utils/competition-day";

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

  async findStanding(
    owner: string,
    season: string,
  ): Promise<{
    entity: CompetitionStandingEntity | null;
    greaterCount: number;
    precedingTieCount: number;
    rankedCount: number;
  }> {
    // The Account anchors the read so an absent standing still carries the Season's ranked count.
    const { entities, raw } = await this.attempts.manager
      .createQueryBuilder<AuthUserEntity & { standing: CompetitionStandingEntity | null }>(
        AuthUserEntity,
        "account",
      )
      .leftJoinAndMapOne(
        "account.standing",
        CompetitionStandingEntity,
        "standing",
        "standing.owner = account.id AND standing.season = :season",
      )
      .leftJoin(PlayerProfileEntity, "profile", "profile.owner = account.id")
      .addSelect(
        (query) =>
          query
            .select("COUNT(*)")
            .from(CompetitionStandingEntity, "ranked")
            .where("ranked.season = :season"),
        "rankedCount",
      )
      .addSelect(
        (query) =>
          query
            .select("COUNT(*)")
            .from(CompetitionStandingEntity, "better")
            .where("better.season = :season AND better.total > standing.total"),
        "greaterCount",
      )
      .addSelect(
        (query) =>
          query
            .select("COUNT(*)")
            .from(CompetitionStandingEntity, "tied")
            .innerJoin(PlayerProfileEntity, "tiedProfile", "tiedProfile.owner = tied.owner")
            .where("tied.season = :season AND tied.total = standing.total")
            .andWhere("tiedProfile.pseudoKey < profile.pseudoKey"),
        "precedingTieCount",
      )
      .where("account.id = :owner", { owner, season })
      .getRawAndEntities<{
        rankedCount: string;
        greaterCount: string;
        precedingTieCount: string;
      }>();
    return {
      entity: entities[0]?.standing ?? null,
      rankedCount: Number(raw[0]?.rankedCount ?? 0),
      greaterCount: Number(raw[0]?.greaterCount ?? 0),
      precedingTieCount: Number(raw[0]?.precedingTieCount ?? 0),
    };
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
    return this.attempts.manager.transaction("READ COMMITTED", async (manager) => {
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
      const attempt = await manager.findOneByOrFail(CompetitionAttemptEntity, { id: attemptId });
      await this.recomputeStanding(manager, attempt);
      return attempt;
    });
  }

  private async recomputeStanding(
    manager: EntityManager,
    attempt: CompetitionAttemptEntity,
  ): Promise<void> {
    const { season, from, to } = seasonBounds(attempt.day);
    const where = { owner: attempt.owner, season };
    await manager
      .createQueryBuilder()
      .insert()
      .into(CompetitionStandingEntity)
      .values({ ...where, total: 0 })
      .orIgnore()
      .execute();
    // Serialize this Account's Season writes before reading the newly committed Attempts.
    await manager.findOneOrFail(CompetitionStandingEntity, {
      where,
      lock: { mode: "pessimistic_write" },
    });
    const attempts = await manager.find(CompetitionAttemptEntity, {
      where: { owner: attempt.owner, status: "finalized", day: Between(from, to) },
    });
    await manager.upsert(
      CompetitionStandingEntity,
      {
        ...where,
        total: seasonTotal(attempts.map((row) => ({ day: row.day, score: row.score ?? 0 }))),
      },
      ["owner", "season"],
    );
  }
}
