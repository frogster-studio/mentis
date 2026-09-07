import { DataSource, type Repository } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { AuthUserEntity } from "../../_database/entities/auth-user.entity";
import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CompetitionStandingEntity } from "../../_database/entities/competition-standing.entity";
import { PlayerProfileEntity } from "../../_database/entities/player-profile.entity";
import { CompetitionRepository } from "../repositories/competition.repository";

const SEASON = "2026-08";

class MetadataDataSource extends DataSource {
  override buildMetadatas(): Promise<void> {
    return super.buildMetadatas();
  }
}

async function leaderboardHarness() {
  const source = new MetadataDataSource({
    type: "postgres",
    entities: [AuthUserEntity, CompetitionStandingEntity, PlayerProfileEntity],
  });
  await source.buildMetadatas();
  const runner = source.createQueryRunner();
  const query = vi.spyOn(runner, "query").mockImplementation(async (sql: string) => ({
    records: sql.includes("COUNT(1)")
      ? [{ cnt: "60" }]
      : [{ rank: "51", pseudo: "Zoe_42", total: 30 }],
  }));
  vi.spyOn(source, "createQueryRunner").mockReturnValue(runner);
  const repository = new CompetitionRepository(
    { manager: source.manager } as Repository<CompetitionAttemptEntity>,
    {} as Repository<CompetitionAnswerEntity>,
  );
  return { repository, query };
}

describe("CompetitionRepository.findLeaderboardPage", () => {
  it("ranks the Season's standings by total, then pseudo key, and converts the counts", async () => {
    const { repository, query } = await leaderboardHarness();

    await expect(repository.findLeaderboardPage(SEASON, 2)).resolves.toEqual({
      entries: [{ rank: 51, pseudo: "Zoe_42", total: 30 }],
      rankedCount: 60,
    });

    const [sql, parameters] = query.mock.calls[0];
    expect(parameters).toEqual([SEASON]);
    expect(sql).toContain('RANK() OVER (ORDER BY "standing"."total" DESC) AS "rank"');
    expect(sql).toContain('INNER JOIN "player_profiles" "profile"');
    expect(sql).toContain('"standing"."season" = $1');
    expect(sql).toContain('ORDER BY "standing"."total" DESC, "profile"."pseudo_key" ASC');
    expect(sql).toContain("LIMIT 100");
    expect(sql).toContain("OFFSET 50");
  });

  it("counts the whole Season for the page count, page by page", async () => {
    const { repository, query } = await leaderboardHarness();

    await repository.findLeaderboardPage(SEASON, 1);

    const counting = query.mock.calls.map(([sql]) => sql).filter((sql) => sql.includes("COUNT(1)"));
    expect(counting).toHaveLength(1);
    expect(counting[0]).toContain('"CompetitionStandingEntity"."season" = $1');
  });
});
