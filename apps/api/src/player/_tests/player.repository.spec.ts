import { DataSource } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { AuthUserEntity } from "../../_database/entities/auth-user.entity";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { PracticeDayEntity } from "../../_database/entities/practice-day.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { QuizSessionEntity } from "../../_database/entities/quiz-session.entity";
import { StatBaselineEntity } from "../../_database/entities/stat-baseline.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { PlayerRepository } from "../repositories/player.repository";

const OWNER = "11111111-1111-4111-8111-111111111111";

class MetadataDataSource extends DataSource {
  override buildMetadatas(): Promise<void> {
    return super.buildMetadatas();
  }
}

const dayRecords = (...values: string[]) => values.map((day) => ({ day }));

async function repositoryHarness(recordsByTable: Record<string, object[]>) {
  const source = new MetadataDataSource({
    type: "postgres",
    entities: [
      AuthUserEntity,
      QuizSessionEntity,
      StatBaselineEntity,
      PracticeDayEntity,
      CompetitionAttemptEntity,
      CompetitionAnswerEntity,
      ThemeEntity,
      CategoryEntity,
      QuestionEntity,
    ],
  });
  await source.buildMetadatas();
  const runner = source.createQueryRunner();
  const query = vi.spyOn(runner, "query").mockImplementation(async (sql: string) => {
    const table = Object.keys(recordsByTable).find((name) => sql.includes(`FROM "${name}"`));
    return { records: table === undefined ? [] : recordsByTable[table] };
  });
  vi.spyOn(source, "createQueryRunner").mockReturnValue(runner);
  const repository = new PlayerRepository(
    source.getRepository(QuizSessionEntity),
    source.getRepository(StatBaselineEntity),
    source.getRepository(PracticeDayEntity),
    source.getRepository(CompetitionAttemptEntity),
    source.getRepository(ThemeEntity),
  );
  const sqlFrom = (table: string) => {
    const call = query.mock.calls.find(([sql]) => sql.includes(`FROM "${table}"`));
    return { sql: call?.[0], parameters: call?.[1] };
  };
  return { repository, query, sqlFrom };
}

describe("PlayerRepository.findPracticeDays", () => {
  it("unions the Paris days sessions finished on with the deposited days, each once", async () => {
    const { repository } = await repositoryHarness({
      quiz_sessions: dayRecords("2026-04-01", "2026-04-02"),
      practice_days: dayRecords("2026-03-31", "2026-04-01"),
    });

    const days = await repository.findPracticeDays(OWNER);

    expect(days.sort()).toEqual(["2026-03-31", "2026-04-01", "2026-04-02"]);
  });

  it("reads a session's day as its Europe/Paris date, once per day, for the owner alone", async () => {
    const { repository, sqlFrom } = await repositoryHarness({});

    await repository.findPracticeDays(OWNER);

    const { sql, parameters } = sqlFrom("quiz_sessions");
    expect(sql).toContain(
      `SELECT DISTINCT to_char("session"."finished_at" AT TIME ZONE 'Europe/Paris', 'YYYY-MM-DD') AS "day"`,
    );
    expect(sql).toContain('WHERE "session"."owner" = $1');
    expect(parameters).toEqual([OWNER]);
  });

  it("reads the deposited days of the owner alone, once per day across devices", async () => {
    const { repository, sqlFrom } = await repositoryHarness({});

    await repository.findPracticeDays(OWNER);

    const { sql, parameters } = sqlFrom("practice_days");
    expect(sql).toContain(`SELECT DISTINCT to_char("practiceDay"."day", 'YYYY-MM-DD') AS "day"`);
    expect(sql).toContain('WHERE "practiceDay"."owner" = $1');
    expect(parameters).toEqual([OWNER]);
  });
});

describe("PlayerRepository.findCompetitionDays", () => {
  it("reads the owner's distinct Competition Days, whatever the Attempt's status", async () => {
    const { repository, sqlFrom } = await repositoryHarness({
      competition_attempts: dayRecords("2026-04-01", "2026-04-02"),
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

describe("PlayerRepository.sumQuizSessionsByTheme", () => {
  it("sums the owner's sessions per Theme in SQL, with the name captured last", async () => {
    const { repository, sqlFrom } = await repositoryHarness({
      quiz_sessions: [
        {
          themeId: "geo",
          sessionCount: "2",
          totalPoints: "70",
          bestScore: 40,
          themeName: "Géographie",
          capturedAt: new Date("2026-08-11T10:00:00.000Z"),
        },
      ],
    });

    await expect(repository.sumQuizSessionsByTheme(OWNER)).resolves.toEqual([
      {
        themeId: "geo",
        sessionCount: 2,
        totalPoints: 70,
        bestScore: 40,
        themeName: "Géographie",
        capturedAt: new Date("2026-08-11T10:00:00.000Z"),
      },
    ]);

    const { sql, parameters } = sqlFrom("quiz_sessions");
    expect(sql).toContain('count("session"."id") AS "sessionCount"');
    expect(sql).toContain('sum("session"."points") AS "totalPoints"');
    expect(sql).toContain('max("session"."points") AS "bestScore"');
    expect(sql).toContain(
      '(array_agg("session"."theme_name" ORDER BY "session"."finished_at" DESC))[1] AS "themeName"',
    );
    expect(sql).toContain('WHERE "session"."owner" = $1');
    expect(sql).toContain('GROUP BY "session"."theme_id"');
    expect(parameters).toEqual([OWNER]);
  });
});

describe("PlayerRepository.sumStatBaselinesByTheme", () => {
  it("sums the owner's baselines per Theme in SQL, across devices, the best unknown when none is", async () => {
    const { repository, sqlFrom } = await repositoryHarness({
      stat_baselines: [
        {
          themeId: "geo",
          sessionCount: "7",
          totalPoints: "210",
          bestScore: null,
          themeName: "Géographie",
          capturedAt: "2026-08-11T10:00:00.000Z",
        },
      ],
    });

    await expect(repository.sumStatBaselinesByTheme(OWNER)).resolves.toEqual([
      {
        themeId: "geo",
        sessionCount: 7,
        totalPoints: 210,
        bestScore: null,
        themeName: "Géographie",
        capturedAt: new Date("2026-08-11T10:00:00.000Z"),
      },
    ]);

    const { sql, parameters } = sqlFrom("stat_baselines");
    expect(sql).toContain('sum("baseline"."session_count") AS "sessionCount"');
    expect(sql).toContain('sum("baseline"."total_points") AS "totalPoints"');
    expect(sql).toContain('max("baseline"."best_score") AS "bestScore"');
    expect(sql).toContain('WHERE "baseline"."owner" = $1');
    expect(sql).toContain('GROUP BY "baseline"."theme_id"');
    expect(parameters).toEqual([OWNER]);
  });
});

describe("PlayerRepository.findThemesWithCategory", () => {
  it("reads the Themes with their Category, published or not", async () => {
    const { repository, sqlFrom } = await repositoryHarness({});

    await repository.findThemesWithCategory(["geo", "art"]);

    const { sql, parameters } = sqlFrom("themes");
    expect(sql).toContain('JOIN "categories"');
    expect(sql).toContain("IN ($1, $2)");
    expect(sql?.split("WHERE")[1]).not.toContain("published");
    expect(parameters).toEqual(["geo", "art"]);
  });

  it("asks nothing of the database for no Theme", async () => {
    const { repository, query } = await repositoryHarness({});

    await expect(repository.findThemesWithCategory([])).resolves.toEqual([]);
    expect(query).not.toHaveBeenCalled();
  });
});
