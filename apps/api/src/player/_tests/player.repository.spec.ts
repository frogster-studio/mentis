import { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { AuthUserEntity } from "../../_database/entities/auth-user.entity";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { PracticeDayEntity } from "../../_database/entities/practice-day.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { PlayerRepository } from "../repositories/player.repository";

const OWNER = "11111111-1111-4111-8111-111111111111";

class MetadataDataSource extends DataSource {
  override buildMetadatas(): Promise<void> {
    return super.buildMetadatas();
  }
}

async function daysHarness(daysByTable: Record<string, string[]>) {
  const source = new MetadataDataSource({
    type: "postgres",
    entities: [
      AuthUserEntity,
      QuizSessionEntity,
      StatBaselineEntity,
      PracticeDayEntity,
      CompetitionAttemptEntity,
      CompetitionAnswerEntity,
    ],
  });
  await source.buildMetadatas();
  const runner = source.createQueryRunner();
  const query = vi.spyOn(runner, "query").mockImplementation(async (sql: string) => {
    const table = Object.keys(daysByTable).find((name) => sql.includes(`FROM "${name}"`));
    return { records: (table === undefined ? [] : daysByTable[table]).map((day) => ({ day })) };
  });
  vi.spyOn(source, "createQueryRunner").mockReturnValue(runner);
  const repository = new PlayerRepository(
    source.getRepository(QuizSessionEntity),
    source.getRepository(StatBaselineEntity),
    source.getRepository(PracticeDayEntity),
    source.getRepository(CompetitionAttemptEntity),
  );
  const sqlFrom = (table: string) => {
    const call = query.mock.calls.find(([sql]) => sql.includes(`FROM "${table}"`));
    return { sql: call?.[0], parameters: call?.[1] };
  };
  return { repository, sqlFrom };
}

describe("PlayerRepository.findPracticeDays", () => {
  it("unions the Paris days sessions finished on with the deposited days, each once", async () => {
    const { repository } = await daysHarness({
      quiz_sessions: ["2026-04-01", "2026-04-02"],
      practice_days: ["2026-03-31", "2026-04-01"],
    });

    const days = await repository.findPracticeDays(OWNER);

    expect(days.sort()).toEqual(["2026-03-31", "2026-04-01", "2026-04-02"]);
  });

  it("reads a session's day as its Europe/Paris date, once per day, for the owner alone", async () => {
    const { repository, sqlFrom } = await daysHarness({});

    await repository.findPracticeDays(OWNER);

    const { sql, parameters } = sqlFrom("quiz_sessions");
    expect(sql).toContain(
      `SELECT DISTINCT to_char("session"."finished_at" AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') AS "day"`,
    );
    expect(sql).toContain('WHERE "session"."owner" = $1');
    expect(parameters).toEqual([OWNER]);
  });

  it("reads the deposited days of the owner alone, once per day across devices", async () => {
    const { repository, sqlFrom } = await daysHarness({});

    await repository.findPracticeDays(OWNER);

    const { sql, parameters } = sqlFrom("practice_days");
    expect(sql).toContain(`SELECT DISTINCT to_char("practiceDay"."day", 'YYYY-MM-DD') AS "day"`);
    expect(sql).toContain('WHERE "practiceDay"."owner" = $1');
    expect(parameters).toEqual([OWNER]);
  });
});

describe("PlayerRepository.findCompetitionDays", () => {
  it("reads the owner's distinct Competition Days, whatever the Attempt's status", async () => {
    const { repository, sqlFrom } = await daysHarness({
      competition_attempts: ["2026-04-01", "2026-04-02"],
    });

    await expect(repository.findCompetitionDays(OWNER)).resolves.toEqual([
      "2026-04-01",
      "2026-04-02",
    ]);

    const { sql, parameters } = sqlFrom("competition_attempts");
    expect(sql).toContain(`SELECT DISTINCT to_char("attempt"."day", 'YYYY-MM-DD') AS "day"`);
    expect(sql).toContain('WHERE "attempt"."owner" = $1');
    expect(sql).not.toContain("status");
    expect(sql).not.toContain("finalize_reason");
    expect(parameters).toEqual([OWNER]);
  });
});
