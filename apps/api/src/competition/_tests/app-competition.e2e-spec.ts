import { COMPETITION_QUESTION_COUNT } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { JWKS } from "../../auth/jwks";
import {
  CatalogRepository,
  type DrawnQuestion,
} from "../../catalog/repositories/catalog.repository";
import { ENV } from "../../env";
import { RootModule } from "../../root.module";
import { CompetitionRepository } from "../repositories/competition.repository";
import { competitionDay, daysBefore } from "../services/competition-day";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
const ISSUED_ATTEMPT = "30000000-0000-4000-8000-000000000001";
const attemptId = (index: number) => `30000000-0000-4000-8000-${String(index).padStart(12, "0")}`;

const themeQuestions = (themeId: string, themeName: string, count: number): DrawnQuestion[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `${themeId}-q${index}`,
    themeId,
    themeName,
    text: `${themeId} question ${index} ?`,
    answer: `reponse-${themeId}-${index}`,
    aliases: [`alias-${themeId}-${index}`],
    misspellings: [`faute-${themeId}-${index}`],
    wrongChoices: [`faux-a-${index}`, `faux-b-${index}`, `faux-c-${index}`],
  }));

const QUESTIONS: DrawnQuestion[] = [
  ...themeQuestions("alpha", "Alpha", 12),
  ...themeQuestions("beta", "Beta", 10),
  ...themeQuestions("gamma", "Gamma", 10),
  ...themeQuestions("delta", "Delta", 10),
  // One Question short of a Competition Session, so this Theme never wins a draw.
  ...themeQuestions("maigre", "Maigre", 9),
];

const THEMES = [
  { id: "alpha", name: "Alpha" },
  { id: "beta", name: "Beta" },
  { id: "gamma", name: "Gamma" },
  { id: "delta", name: "Delta" },
  { id: "maigre", name: "Maigre" },
];
const ELIGIBLE_THEME_IDS = ["alpha", "beta", "gamma", "delta"];

const servedIds = (themeId: string) =>
  QUESTIONS.filter((question) => question.themeId === themeId)
    .slice(0, COMPETITION_QUESTION_COUNT)
    .map((question) => question.id);

const attemptRow = (
  overrides: Partial<CompetitionAttemptEntity> = {},
): CompetitionAttemptEntity => ({
  id: attemptId(99),
  owner: PLAYER_A,
  day: "2026-08-20",
  kind: "initial",
  status: "active",
  themeId: "alpha",
  themeName: "Alpha",
  questionIds: servedIds("alpha"),
  finalizeReason: null,
  score: null,
  issuedAt: new Date("2026-08-20T08:00:00.000Z"),
  finalizedAt: null,
  ...overrides,
});

let attemptRows: CompetitionAttemptEntity[] = [];
let draws: { themeId: string | null; count: number }[] = [];
let issuedAttempts: { owner: string; day: string; kind: string }[] = [];
let ineligibleThemeIds: string[] = [];
let racingAttempt: CompetitionAttemptEntity | null = null;

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCatalogRepository = {
  async themesWithQuestionCounts() {
    return THEMES.map((theme) => ({
      ...theme,
      questionCount: ineligibleThemeIds.includes(theme.id)
        ? 0
        : QUESTIONS.filter((question) => question.themeId === theme.id).length,
    }));
  },
  async themeExists(id) {
    return THEMES.some((theme) => theme.id === id);
  },
  async drawRandomQuestions(themeId, count) {
    draws.push({ themeId, count });
    return QUESTIONS.filter((question) => question.themeId === themeId).slice(0, count);
  },
  async questionsByIds(ids) {
    return QUESTIONS.filter((question) => ids.includes(question.id));
  },
} satisfies Pick<
  CatalogRepository,
  "themesWithQuestionCounts" | "themeExists" | "drawRandomQuestions" | "questionsByIds"
>;

const fakeCompetitionRepository = {
  async findAttempt(owner, day, kind) {
    return (
      attemptRows.find((row) => row.owner === owner && row.day === day && row.kind === kind) ?? null
    );
  },
  async themeIdsPlayedBetween(owner, from, to) {
    return attemptRows
      .filter((row) => row.owner === owner && row.day >= from && row.day <= to)
      .map((row) => row.themeId);
  },
  async issue(attempt) {
    issuedAttempts.push({ owner: attempt.owner, day: attempt.day, kind: attempt.kind });
    // The other device's insert landed between this one's read and its own write.
    if (racingAttempt !== null) {
      attemptRows.push(racingAttempt);
      racingAttempt = null;
    }
    // Mirrors competition_attempts_one_per_kind: the loser of the race returns nothing.
    const clash = attemptRows.some(
      (row) => row.owner === attempt.owner && row.day === attempt.day && row.kind === attempt.kind,
    );
    if (clash) {
      return null;
    }
    const stored = attemptRow({ ...attempt, id: ISSUED_ATTEMPT });
    attemptRows.push(stored);
    return stored;
  },
} satisfies Pick<CompetitionRepository, "findAttempt" | "themeIdsPlayedBetween" | "issue">;

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
      .overrideProvider(CatalogRepository)
      .useValue(fakeCatalogRepository)
      .overrideProvider(CompetitionRepository)
      .useValue(fakeCompetitionRepository)
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
    draws = [];
    issuedAttempts = [];
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
    expect(draws).toEqual([{ themeId: body.themeId, count: COMPETITION_QUESTION_COUNT }]);
    expect(attemptRows).toHaveLength(1);
    expect(attemptRows[0]).toMatchObject({ owner: PLAYER_A, day: today, kind: "initial" });
    expect(attemptRows[0].questionIds).toEqual(
      body.questions.map((question: { id: string }) => question.id),
    );
  });

  it("serves every Question with its 4 pre-shuffled Square choices", async () => {
    const body = await issued(tokenA);

    for (const question of body.questions as { id: string; squareChoices: string[] }[]) {
      const source = QUESTIONS.find((row) => row.id === question.id);
      expect(source).toBeDefined();
      expect(new Set(question.squareChoices)).toEqual(
        new Set([source?.answer, ...(source?.wrongChoices ?? [])]),
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
    draws = [];
    issuedAttempts = [];

    const second = await issued(tokenA);
    expect(second.id).toBe(first.id);
    expect(second.themeId).toBe(first.themeId);
    // Same Questions in the same order, each with the choices it was first served in.
    expect(second.questions).toEqual(first.questions);
    expect(draws).toEqual([]);
    expect(issuedAttempts).toEqual([]);
    expect(attemptRows).toHaveLength(1);
  });

  it("draws around the Themes of the previous two Competition Days and of today", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(2), day: daysBefore(today, 1), themeId: "alpha" }),
      attemptRow({ id: attemptId(3), day: daysBefore(today, 2), themeId: "beta" }),
      attemptRow({ id: attemptId(4), day: today, kind: "replay", themeId: "gamma" }),
    );

    const body = await issued(tokenA);
    expect(body.themeId).toBe("delta");
  });

  it("forgets a Theme older than the rotation window", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(5), day: daysBefore(today, 1), themeId: "alpha" }),
      attemptRow({ id: attemptId(6), day: daysBefore(today, 2), themeId: "beta" }),
      attemptRow({ id: attemptId(7), day: daysBefore(today, 3), themeId: "gamma" }),
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
      attemptRow({ id: attemptId(8), day: daysBefore(today, 1), themeId: "alpha" }),
      attemptRow({ id: attemptId(9), day: daysBefore(today, 1), kind: "replay", themeId: "beta" }),
      attemptRow({ id: attemptId(10), day: daysBefore(today, 2), themeId: "gamma" }),
      attemptRow({ id: attemptId(11), day: today, kind: "replay", themeId: "delta" }),
    );

    const body = await issued(tokenA);
    expect(ELIGIBLE_THEME_IDS).toContain(body.themeId);
  });

  it("another Player's Attempts never enter this Player's rotation", async () => {
    ineligibleThemeIds = ["delta"];
    for (let round = 0; round < 5; round += 1) {
      attemptRows = [
        attemptRow({ id: attemptId(12), owner: PLAYER_B, day: today, themeId: "alpha" }),
        attemptRow({ id: attemptId(13), day: daysBefore(today, 1), themeId: "beta" }),
        attemptRow({ id: attemptId(14), day: daysBefore(today, 2), themeId: "gamma" }),
      ];

      const body = await issued(tokenA);
      expect(body.themeId).toBe("alpha");
    }
  });

  it("two devices asking at once share the single Attempt the day allows", async () => {
    racingAttempt = attemptRow({
      id: attemptId(15),
      day: today,
      themeId: "beta",
      themeName: "Beta",
      questionIds: servedIds("beta"),
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
