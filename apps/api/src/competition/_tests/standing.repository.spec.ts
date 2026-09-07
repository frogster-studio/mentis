import { DataSource, type Repository } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { AuthUserEntity } from "../../_database/entities/auth-user.entity";
import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CompetitionStandingEntity } from "../../_database/entities/competition-standing.entity";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import { CompetitionRepository } from "../repositories/competition.repository";

const OWNER = "11111111-1111-4111-8111-111111111111";
const SEASON = "2026-08";
const CREATED_AT = new Date("2026-08-01T08:00:00Z");
const UPDATED_AT = new Date("2026-08-20T08:00:00Z");

class MetadataDataSource extends DataSource {
  override buildMetadatas(): Promise<void> {
    return super.buildMetadatas();
  }
}

async function standingHarness(ranked: boolean) {
  const source = new MetadataDataSource({
    type: "postgres",
    entities: [AuthUserEntity, CompetitionStandingEntity, PlayerProfileEntity],
  });
  await source.buildMetadatas();
  const runner = source.createQueryRunner();
  const query = vi.spyOn(runner, "query").mockResolvedValue({
    records: [
      {
        account_id: OWNER,
        standing_id: ranked ? "30000000-0000-4000-8000-000000000001" : null,
        standing_owner: ranked ? OWNER : null,
        standing_season: ranked ? SEASON : null,
        standing_total: ranked ? 30 : null,
        standing_created_at: ranked ? CREATED_AT : null,
        standing_updated_at: ranked ? UPDATED_AT : null,
        greaterCount: ranked ? "2" : "0",
        precedingTieCount: ranked ? "48" : "0",
        rankedCount: "60",
      },
    ],
  });
  vi.spyOn(source, "createQueryRunner").mockReturnValue(runner);
  const repository = new CompetitionRepository(
    { manager: source.manager } as Repository<CompetitionAttemptEntity>,
    {} as Repository<CompetitionAnswerEntity>,
  );
  return { repository, query };
}

describe("CompetitionRepository.findStanding", () => {
  it("hydrates the whole standings entity and converts PostgreSQL counts in one query", async () => {
    const { repository, query } = await standingHarness(true);
    const result = await repository.findStanding(OWNER, SEASON);
    expect(result).toEqual({
      entity: Object.assign(new CompetitionStandingEntity(), {
        id: "30000000-0000-4000-8000-000000000001",
        owner: OWNER,
        season: SEASON,
        total: 30,
        createdAt: CREATED_AT,
        updatedAt: UPDATED_AT,
      }),
      greaterCount: 2,
      precedingTieCount: 48,
      rankedCount: 60,
    });
    expect(query).toHaveBeenCalledOnce();
    const [sql, parameters] = query.mock.calls[0];
    expect(parameters).toEqual([SEASON, OWNER]);
    expect(sql).toContain('"standing"."season" = $1');
    expect(sql).toContain('"account"."id" = $2');
    expect(sql).toContain('"better"."season" = $1 AND "better"."total" > "standing"."total"');
    expect(sql).toContain('"tied"."season" = $1 AND "tied"."total" = "standing"."total"');
    expect(sql).toContain('"tiedProfile"."pseudo_key" < "profile"."pseudo_key"');
    expect(sql).toContain('"ranked"."season" = $1');
    expect(sql).not.toContain("competition_attempts");
  });

  it("keeps the Season's ranked count when the Account has no standings row", async () => {
    const { repository, query } = await standingHarness(false);
    await expect(repository.findStanding(OWNER, SEASON)).resolves.toEqual({
      entity: null,
      greaterCount: 0,
      precedingTieCount: 0,
      rankedCount: 60,
    });
    expect(query).toHaveBeenCalledOnce();
  });
});
