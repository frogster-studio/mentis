import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Between, Repository } from "typeorm";
import {
  CompetitionAttemptEntity,
  type CompetitionAttemptKind,
} from "../../_database/entities/competition-attempt.entity";

export type NewAttempt = {
  owner: string;
  day: string;
  kind: CompetitionAttemptKind;
  themeId: string;
  themeName: string;
  questionIds: string[];
};

@Injectable()
export class CompetitionRepository {
  constructor(
    @InjectRepository(CompetitionAttemptEntity)
    private readonly attempts: Repository<CompetitionAttemptEntity>,
  ) {}

  findAttempt(
    owner: string,
    day: string,
    kind: CompetitionAttemptKind,
  ): Promise<CompetitionAttemptEntity | null> {
    return this.attempts.findOneBy({ owner, day, kind });
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
}
