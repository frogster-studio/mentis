import { COMPETITION_QUESTION_COUNT } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { stubDataSource, testEnv } from "../src/_tests/test-env";
import { competitionDay, daysBefore } from "../src/app/competition-day";
import { JWKS } from "../src/auth/jwks";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
const ISSUED_ATTEMPT = "30000000-0000-4000-8000-000000000001";
const attemptId = (index: number) => `30000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

type AttemptRow = {
  id: string;
  owner: string;
  day: string;
  kind: string;
  status: string;
  theme_id: string;
  theme_name: string;
  question_ids: string[];
};

type QuestionRow = {
  id: string;
  theme_id: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrong_choices: string[];
};

const themeQuestions = (themeId: string, count: number): QuestionRow[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${themeId}-q${index}`,
    theme_id: themeId,
    text: `${themeId} question ${index} ?`,
    answer: `reponse-${themeId}-${index}`,
    aliases: [`alias-${themeId}-${index}`],
    misspellings: [`faute-${themeId}-${index}`],
    wrong_choices: [`faux-a-${index}`, `faux-b-${index}`, `faux-c-${index}`],
  }));

const THEMES = [
  { id: "alpha", name: "Alpha" },
  { id: "beta", name: "Beta" },
  { id: "gamma", name: "Gamma" },
  { id: "delta", name: "Delta" },
  { id: "maigre", name: "Maigre" },
];
const ELIGIBLE_THEME_IDS = ["alpha", "beta", "gamma", "delta"];

const QUESTIONS: QuestionRow[] = [
  ...themeQuestions("alpha", 12),
  ...themeQuestions("beta", 10),
  ...themeQuestions("gamma", 10),
  ...themeQuestions("delta", 10),
  // One Question short of a Competition Session, so this Theme never wins a draw.
  ...themeQuestions("maigre", 9),
];

const servedIds = (themeId: string) =>
  QUESTIONS.filter((question) => question.theme_id === themeId)
    .slice(0, COMPETITION_QUESTION_COUNT)
    .map((question) => question.id);

const attemptRow = (overrides: Partial<AttemptRow> = {}): AttemptRow => ({
  id: attemptId(99),
  owner: PLAYER_A,
  day: "2026-08-20",
  kind: "initial",
  status: "active",
  theme_id: "alpha",
  theme_name: "Alpha",
  question_ids: servedIds("alpha"),
  ...overrides,
});

type Filter = { op: "eq" | "gte" | "lte" | "in"; column: string; value: unknown };

const matches = (row: Record<string, unknown>, filter: Filter): boolean => {
  const cell = row[filter.column] as string;
  if (filter.op === "in") {
    return (filter.value as string[]).includes(cell);
  }
  if (filter.op === "gte") {
    return cell >= (filter.value as string);
  }
  if (filter.op === "lte") {
    return cell <= (filter.value as string);
  }
  return cell === filter.value;
};

type FilteredQuery = Promise<{ data: unknown[]; error: null }> & {
  eq: (column: string, value: unknown) => FilteredQuery;
  gte: (column: string, value: unknown) => FilteredQuery;
  lte: (column: string, value: unknown) => FilteredQuery;
  in: (column: string, value: unknown) => FilteredQuery;
  maybeSingle: () => Promise<{ data: unknown; error: null }>;
};

// Stands in for PostgREST: the filters run for real, the aliased selects are projected by hand.
const filtered = <Row extends Record<string, unknown>>(
  rows: () => Row[],
  project: (row: Row) => unknown,
): FilteredQuery => {
  const step = (filters: Filter[]): FilteredQuery => {
    const kept = () =>
      rows()
        .filter((row) => filters.every((filter) => matches(row, filter)))
        .map(project);
    const add = (op: Filter["op"]) => (column: string, value: unknown) =>
      step([...filters, { op, column, value }]);
    return Object.assign(Promise.resolve({ data: kept(), error: null }), {
      eq: add("eq"),
      gte: add("gte"),
      lte: add("lte"),
      in: add("in"),
      maybeSingle: () => Promise.resolve({ data: kept()[0] ?? null, error: null }),
    });
  };
  return step([]);
};

const projectAttempt = (row: AttemptRow) => ({
  id: row.id,
  day: row.day,
  kind: row.kind,
  status: row.status,
  themeId: row.theme_id,
  themeName: row.theme_name,
  questionIds: row.question_ids,
});

const projectQuestion = (row: QuestionRow) => ({
  id: row.id,
  text: row.text,
  answer: row.answer,
  wrongChoices: row.wrong_choices,
});

const UNIQUE_VIOLATION = { code: "23505", message: "duplicate key", details: "", hint: "" };

let attemptRows: AttemptRow[] = [];
let drawArgs: { theme_slug: string | null; n: number }[] = [];
let insertedRows: Record<string, unknown>[] = [];
let ineligibleThemeIds: string[] = [];
let racingAttempt: AttemptRow | null = null;

const stubSupabase = {
  from: (table: string) => {
    if (table === "competition_attempts") {
      return {
        select: () => filtered(() => attemptRows, projectAttempt),
        insert: (row: Record<string, unknown>) => {
          insertedRows.push(row);
          // The other device's insert landed between this one's read and its own write.
          if (racingAttempt !== null) {
            attemptRows.push(racingAttempt);
            racingAttempt = null;
          }
          const clash = attemptRows.some(
            (existing) =>
              existing.owner === row.owner &&
              existing.day === row.day &&
              existing.kind === row.kind,
          );
          const stored = { id: ISSUED_ATTEMPT, status: "active", ...row } as AttemptRow;
          if (!clash) {
            attemptRows.push(stored);
          }
          return {
            select: () => ({
              single: () =>
                Promise.resolve(
                  clash
                    ? { data: null, error: UNIQUE_VIOLATION }
                    : { data: projectAttempt(stored), error: null },
                ),
            }),
          };
        },
      };
    }
    if (table === "questions") {
      return { select: () => filtered(() => QUESTIONS, projectQuestion) };
    }
    if (table === "themes") {
      return {
        select: () =>
          Promise.resolve({
            data: THEMES.map((theme) => ({
              id: theme.id,
              name: theme.name,
              questions: [
                {
                  count: ineligibleThemeIds.includes(theme.id)
                    ? 0
                    : QUESTIONS.filter((question) => question.theme_id === theme.id).length,
                },
              ],
            })),
            error: null,
          }),
      };
    }
    throw new Error(`unexpected table ${table}`);
  },
  rpc: (fn: string, args: { theme_slug: string | null; n: number }) => {
    if (fn !== "get_random_questions") {
      throw new Error(`unexpected function ${fn}`);
    }
    drawArgs.push(args);
    const drawn = QUESTIONS.filter((question) => question.theme_id === args.theme_slug)
      .slice(0, args.n)
      .map(projectQuestion);
    return { select: () => Promise.resolve({ data: drawn, error: null }) };
  },
};

describe("app competition routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let tokenA: string;
  const today = competitionDay(new Date());

  const issue = (token: string) =>
    fetch(`${baseUrl}/app/me/competition/attempts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

  const issued = async (token: string) => {
    const response = await issue(token);
    expect(response.status).toBe(200);
    return await response.json();
  };

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    tokenA = await new SignJWT({
      iss: `${testEnv.SUPABASE_URL}/auth/v1`,
      aud: "authenticated",
      sub: PLAYER_A,
      role: "authenticated",
    } satisfies JWTPayload)
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(signingKey.privateKey);

    const moduleRef = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    attemptRows = [];
    drawArgs = [];
    insertedRows = [];
    ineligibleThemeIds = [];
    racingAttempt = null;
  });

  it("POST /app/me/competition/attempts without a token → 401 UNAUTHENTICATED", async () => {
    const response = await fetch(`${baseUrl}/app/me/competition/attempts`, { method: "POST" });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("issues today's initial Attempt and records exactly what it served", async () => {
    const body = await issued(tokenA);

    expect(body).toMatchObject({ day: today, kind: "initial", status: "active" });
    expect(body.questions).toHaveLength(COMPETITION_QUESTION_COUNT);
    expect(drawArgs).toEqual([{ theme_slug: body.themeId, n: COMPETITION_QUESTION_COUNT }]);
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0]).toMatchObject({ owner: PLAYER_A, day: today, kind: "initial" });
    expect(attemptRows[0].question_ids).toEqual(
      body.questions.map((question: { id: string }) => question.id),
    );
  });

  it("serves every Question with its 4 pre-shuffled Square choices", async () => {
    const body = await issued(tokenA);

    for (const question of body.questions as { id: string; squareChoices: string[] }[]) {
      const source = QUESTIONS.find((row) => row.id === question.id);
      expect(source).toBeDefined();
      expect(new Set(question.squareChoices)).toEqual(
        new Set([source?.answer, ...(source?.wrong_choices ?? [])]),
      );
    }
  });

  it("never carries the Canonical Answer, the Aliases or the Misspellings as answer material", async () => {
    const body = await issued(tokenA);
    const wire = JSON.stringify(body);

    for (const question of body.questions as { id: string }[]) {
      expect(Object.keys(question)).toEqual(["id", "text", "squareChoices"]);
    }
    for (const source of QUESTIONS) {
      expect(wire).not.toContain(source.aliases[0]);
      expect(wire).not.toContain(source.misspellings[0]);
    }
    expect(wire).not.toContain("questionIds");
  });

  it("re-asking the same day serves the same Attempt, Square choices included", async () => {
    const first = await issued(tokenA);
    drawArgs = [];
    insertedRows = [];

    const second = await issued(tokenA);
    expect(second.id).toBe(first.id);
    expect(second.themeId).toBe(first.themeId);
    // Same Questions in the same order, each with the choices it was first served in.
    expect(second.questions).toEqual(first.questions);
    expect(drawArgs).toEqual([]);
    expect(insertedRows).toEqual([]);
    expect(attemptRows).toHaveLength(1);
  });

  it("draws around the Themes of the previous two Competition Days and of today", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(2), day: daysBefore(today, 1), theme_id: "alpha" }),
      attemptRow({ id: attemptId(3), day: daysBefore(today, 2), theme_id: "beta" }),
      attemptRow({ id: attemptId(4), day: today, kind: "replay", theme_id: "gamma" }),
    );

    const body = await issued(tokenA);
    expect(body.themeId).toBe("delta");
  });

  it("forgets a Theme older than the rotation window", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(5), day: daysBefore(today, 1), theme_id: "alpha" }),
      attemptRow({ id: attemptId(6), day: daysBefore(today, 2), theme_id: "beta" }),
      attemptRow({ id: attemptId(7), day: daysBefore(today, 3), theme_id: "gamma" }),
    );
    ineligibleThemeIds = ["delta"];

    const body = await issued(tokenA);
    expect(body.themeId).toBe("gamma");
  });

  it("never draws a Theme holding fewer than 10 Questions", async () => {
    const drawn = new Set<string>();
    for (let round = 0; round < 20; round += 1) {
      attemptRows = [];
      drawn.add((await issued(tokenA)).themeId);
    }
    expect(drawn.has("maigre")).toBe(false);
    expect(drawn.size).toBeGreaterThan(1);
  });

  it("plays on rather than deny the day when the rotation excludes every eligible Theme", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(8), day: daysBefore(today, 1), theme_id: "alpha" }),
      attemptRow({ id: attemptId(9), day: daysBefore(today, 1), kind: "replay", theme_id: "beta" }),
      attemptRow({ id: attemptId(10), day: daysBefore(today, 2), theme_id: "gamma" }),
      attemptRow({ id: attemptId(11), day: today, kind: "replay", theme_id: "delta" }),
    );

    const body = await issued(tokenA);
    expect(ELIGIBLE_THEME_IDS).toContain(body.themeId);
  });

  it("another Player's Attempts never enter this Player's rotation", async () => {
    ineligibleThemeIds = ["delta"];
    for (let round = 0; round < 5; round += 1) {
      attemptRows = [
        attemptRow({ id: attemptId(12), owner: PLAYER_B, day: today, theme_id: "alpha" }),
        attemptRow({ id: attemptId(13), day: daysBefore(today, 1), theme_id: "beta" }),
        attemptRow({ id: attemptId(14), day: daysBefore(today, 2), theme_id: "gamma" }),
      ];

      const body = await issued(tokenA);
      expect(body.themeId).toBe("alpha");
    }
  });

  it("two devices asking at once share the single Attempt the day allows", async () => {
    racingAttempt = attemptRow({
      id: attemptId(15),
      day: today,
      theme_id: "beta",
      theme_name: "Beta",
      question_ids: servedIds("beta"),
    });

    const body = await issued(tokenA);
    expect(body.id).toBe(attemptId(15));
    expect(body.themeId).toBe("beta");
    expect(body.questions.map((question: { id: string }) => question.id)).toEqual(
      servedIds("beta"),
    );
    expect(attemptRows).toHaveLength(1);
  });
});
