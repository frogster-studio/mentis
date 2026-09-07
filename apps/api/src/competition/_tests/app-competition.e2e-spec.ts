import { COMPETITION_POINTS, COMPETITION_QUESTION_COUNT } from "@mentis/contracts/app";
import {
  PremiumEnvironmentEnum,
  QuizAnswerModeEnum,
  UserAnswerMatchedViaEnum,
} from "@mentis/contracts/enums";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { ThrottlerStorage } from "@nestjs/throttler";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import {
  CompetitionAttemptEntity,
  type CompetitionAttemptKind,
  type CompetitionFinalizeReason,
} from "../../_database/entities/competition-attempt.entity";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import {
  CatalogRepository,
  type DrawnQuestion,
} from "../../catalog/repositories/catalog.repository";
import { THEME_IMAGES_BUCKET } from "../../catalog/utils/theme-image-url";
import { PremiumRepository } from "../../premium/repositories/premium.repository";
import { CompetitionRepository } from "../repositories/competition.repository";
import type { FinalizedOutcome } from "../types/finalized-outcome";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";
import { CLOCK } from "../utils/clock";
import { competitionDay, daysBefore } from "../utils/competition-day";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
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
  // Twelve Questions under a Theme no Editor published, so this one never wins a draw either.
  ...themeQuestions("secret", "Secret", 12),
];

const judgedQuestion = (
  index: number,
  answer: string,
  aliases: string[],
  misspellings: string[],
): DrawnQuestion => ({
  id: `france-q${index}`,
  themeId: "france",
  themeName: "France",
  text: `Question française ${index} ?`,
  answer,
  aliases,
  misspellings,
  wrongChoices: [`faux-a-${index}`, `faux-b-${index}`, `faux-c-${index}`],
});

// Real content shapes — the verdicts below are the practice rules, proven on the material they run on.
const JUDGED_QUESTIONS: DrawnQuestion[] = [
  judgedQuestion(0, "Paris", ["Ville Lumière"], ["Pari"]),
  judgedQuestion(1, "Élysée", ["Palais de l'Élysée"], []),
  judgedQuestion(2, "États-Unis", ["USA", "Amérique"], ["Etats Unys"]),
  judgedQuestion(3, "Molière", ["Jean-Baptiste Poquelin"], []),
  judgedQuestion(4, "1789", [], []),
  judgedQuestion(5, "Vercingétorix", [], []),
  judgedQuestion(6, "Chrysanthème", [], ["krisantème"]),
  judgedQuestion(7, "Seine", [], []),
  judgedQuestion(8, "Côte d'Ivoire", [], []),
  judgedQuestion(9, "Or", [], []),
];
const JUDGED_IDS = JUDGED_QUESTIONS.map((question) => question.id);
const JUDGED_ATTEMPT = attemptId(20);

const CATEGORY = { id: "nature", name: "Nature", color: "#2e7d32", icon: "park" };

const themeRow = (name: string) => ({
  id: name.toLowerCase(),
  name,
  image: `${name.toLowerCase()}.webp`,
  category: CATEGORY,
});

const THEMES = ["Alpha", "Beta", "Gamma", "Delta", "Maigre", "Secret"].map(themeRow);
// The judged Attempt's Theme sits outside the draw pool, yet its visuals still travel.
const JUDGED_THEME = themeRow("France");
const ELIGIBLE_THEME_IDS = ["alpha", "beta", "gamma", "delta"];
const UNPUBLISHED_THEME_IDS = ["secret"];

const expectedImageUrl = (themeId: string) =>
  `${testEnv.SUPABASE_URL}/storage/v1/object/public/${THEME_IMAGES_BUCKET}/${themeId}.webp`;

const servedIds = (themeId: string) =>
  QUESTIONS.filter((question) => question.themeId === themeId)
    .slice(0, COMPETITION_QUESTION_COUNT)
    .map((question) => question.id);

// Issued on its own day unless said otherwise — only a Catch-up is issued the day after its own.
const attemptRow = (
  overrides: Partial<CompetitionAttemptEntity> = {},
): CompetitionAttemptEntity => {
  const day = overrides.day ?? "2026-08-20";
  return Object.assign(new CompetitionAttemptEntity(), {
    id: attemptId(99),
    owner: PLAYER_A,
    day,
    kind: "initial",
    status: "active",
    themeId: "alpha",
    themeName: "Alpha",
    questionIds: servedIds("alpha"),
    finalizeReason: null,
    score: null,
    issuedAt: new Date(`${day}T08:00:00.000Z`),
    finalizedAt: null,
    ...overrides,
  });
};

const HOUR_MS = 60 * 60 * 1000;

// The suite fires more than one Player's minute allows, so the limiter stands aside here.
const unlimitedThrottlerStorage = {
  async increment() {
    return { totalHits: 0, timeToExpire: 0, isBlocked: false, timeToBlockExpire: 0 };
  },
} satisfies ThrottlerStorage;

const PARIS_AFTERNOON = new Date("2026-08-20T12:00:00.000Z");
let now = PARIS_AFTERNOON;
let attemptRows: CompetitionAttemptEntity[] = [];
let draws: { themeId: string | null; count: number }[] = [];
let issuedAttempts: { owner: string; day: string; kind: string }[] = [];
let ineligibleThemeIds: string[] = [];
let unpublishedThemeIds: string[] = [];
let unreadyQuestionIds: string[] = [];
let racingAttempt: CompetitionAttemptEntity | null = null;
let answerRows: NewCompetitionAnswer[] = [];
let racingFinalize: FinalizedOutcome | null = null;
let premiumUntilByOwner = new Map<string, Date>();

const servedQuestions = () =>
  QUESTIONS.filter(
    (question) =>
      !unpublishedThemeIds.includes(question.themeId) && !unreadyQuestionIds.includes(question.id),
  );

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCatalogRepository = {
  async themesWithQuestionCounts() {
    return THEMES.filter((theme) => !unpublishedThemeIds.includes(theme.id)).map((theme) => ({
      ...theme,
      questionCount: ineligibleThemeIds.includes(theme.id)
        ? 0
        : servedQuestions().filter((question) => question.themeId === theme.id).length,
    }));
  },
  async publishedThemeExists(id) {
    return THEMES.some((theme) => theme.id === id) && !unpublishedThemeIds.includes(id);
  },
  async themeVisualsById(id) {
    const theme = [...THEMES, JUDGED_THEME].find((row) => row.id === id);
    return theme === undefined ? null : { image: theme.image, category: theme.category };
  },
  async drawRandomQuestions(themeId, count) {
    draws.push({ themeId, count });
    return servedQuestions()
      .filter((question) => question.themeId === themeId)
      .slice(0, count);
  },
  // Blind to both exclusion lists on purpose: an issued Attempt outlives its content going dark.
  async questionsByIds(ids) {
    return [...QUESTIONS, ...JUDGED_QUESTIONS].filter((question) => ids.includes(question.id));
  },
} satisfies Pick<
  CatalogRepository,
  | "themesWithQuestionCounts"
  | "publishedThemeExists"
  | "themeVisualsById"
  | "drawRandomQuestions"
  | "questionsByIds"
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
    const stored = attemptRow({
      ...attempt,
      id: attemptId(100 + issuedAttempts.length),
      issuedAt: now,
    });
    attemptRows.push(stored);
    return stored;
  },
  async findOwnedAttempt(id, owner) {
    return attemptRows.find((row) => row.id === id && row.owner === owner) ?? null;
  },
  async findAttemptsOnDay(owner, day) {
    return attemptRows.filter((row) => row.owner === owner && row.day === day);
  },
  async findActiveAttempts(owner) {
    return attemptRows
      .filter((row) => row.owner === owner && row.status === "active")
      .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime());
  },
  async findAnswers(id) {
    return answerRows
      .filter((row) => row.attemptId === id)
      .sort((left, right) => left.position - right.position)
      .map((row) => Object.assign(new CompetitionAnswerEntity(), row));
  },
  async findFinalizedDayScores(owner, from, to) {
    return attemptRows
      .filter(
        (row) =>
          row.owner === owner && row.status === "finalized" && row.day >= from && row.day <= to,
      )
      .map((row) => ({ day: row.day, score: row.score ?? 0 }));
  },
  async finalize(id, outcome) {
    // The other device's finalize landed between this one's read and its own write.
    if (racingFinalize !== null) {
      const { reason, score, answers } = racingFinalize;
      racingFinalize = null;
      applyFinalize(id, reason, score, answers);
    }
    // Mirrors the guarded update: an Attempt already finalized is claimed by nobody else.
    return applyFinalize(id, outcome.reason, outcome.score, outcome.answers);
  },
} satisfies Pick<
  CompetitionRepository,
  | "findAttempt"
  | "themeIdsPlayedBetween"
  | "issue"
  | "findOwnedAttempt"
  | "findAttemptsOnDay"
  | "findActiveAttempts"
  | "findAnswers"
  | "findFinalizedDayScores"
  | "finalize"
>;

const fakePremiumRepository = {
  async findByOwner(owner) {
    const premiumUntil = premiumUntilByOwner.get(owner);
    if (premiumUntil === undefined) {
      return null;
    }
    return Object.assign(new PremiumEntitlementEntity(), {
      id: attemptId(90),
      owner,
      premiumUntil,
      environment: PremiumEnvironmentEnum.SANDBOX,
    });
  },
} satisfies Pick<PremiumRepository, "findByOwner">;

// Every Question of the pool answers to its own pattern, so a drawn Attempt can be played perfectly.
const correctBatch = (body: { themeId: string; questions: { id: string }[] }) =>
  body.questions.map((question, position) => ({
    questionId: question.id,
    mode: QuizAnswerModeEnum.CASH,
    rawInput: `reponse-${body.themeId}-${position}`,
    clientElapsedMs: 1000 + position,
  }));

const applyFinalize = (
  id: string,
  reason: CompetitionFinalizeReason,
  score: number,
  answers: NewCompetitionAnswer[],
): CompetitionAttemptEntity | null => {
  const attempt = attemptRows.find((row) => row.id === id);
  if (attempt === undefined || attempt.status !== "active") {
    return null;
  }
  attempt.status = "finalized";
  attempt.finalizeReason = reason;
  attempt.score = score;
  attempt.finalizedAt = new Date("2026-08-20T09:00:00.000Z");
  answerRows.push(...answers);
  return attempt;
};

describe("app competition routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let tokenA: string;
  let tokenB: string;
  const today = competitionDay(PARIS_AFTERNOON);

  const issue = (token: string, kind: CompetitionAttemptKind = "initial") =>
    fetch(`${baseUrl}/app/me/competition/attempts`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ kind }),
    });

  const issued = async (token: string, kind: CompetitionAttemptKind = "initial") => {
    const response = await issue(token, kind);
    expect(response.status).toBe(200);
    return await response.json();
  };

  const readDay = async (token: string) => {
    const response = await fetch(`${baseUrl}/app/me/competition/day`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    return await response.json();
  };

  const readActive = (token: string) =>
    fetch(`${baseUrl}/app/me/competition/attempts/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  const readActiveBody = async (token: string) => {
    const response = await readActive(token);
    expect(response.status).toBe(200);
    return await response.json();
  };

  const standing = async (token: string) => {
    const response = await fetch(`${baseUrl}/app/me/competition/standing`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
    return await response.json();
  };

  const finalize = (token: string, answers: unknown[], id: string = JUDGED_ATTEMPT) =>
    fetch(`${baseUrl}/app/me/competition/attempts/${id}/finalize`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ answers }),
    });

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    const sign = (sub: string) =>
      new SignJWT({
        iss: `${testEnv.SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        sub,
        role: "authenticated",
      } satisfies JWTPayload)
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(signingKey.privateKey);
    [tokenA, tokenB] = await Promise.all([sign(PLAYER_A), sign(PLAYER_B)]);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(CatalogRepository)
      .useValue(fakeCatalogRepository)
      .overrideProvider(CompetitionRepository)
      .useValue(fakeCompetitionRepository)
      .overrideProvider(PremiumRepository)
      .useValue(fakePremiumRepository)
      .overrideProvider(ThrottlerStorage)
      .useValue(unlimitedThrottlerStorage)
      .overrideProvider(CLOCK)
      .useValue(() => now)
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
    now = PARIS_AFTERNOON;
    attemptRows = [];
    draws = [];
    issuedAttempts = [];
    ineligibleThemeIds = [];
    unpublishedThemeIds = [...UNPUBLISHED_THEME_IDS];
    unreadyQuestionIds = [];
    racingAttempt = null;
    answerRows = [];
    racingFinalize = null;
    premiumUntilByOwner = new Map();
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

  it("carries the drawn Theme's image and Category, so no cached theme list is joined", async () => {
    const body = await issued(tokenA);

    expect(body).toMatchObject({
      imageUrl: expectedImageUrl(body.themeId),
      category: CATEGORY,
    });
  });

  it("serves the same Theme visuals to the Attempt a crashed phone resumes", async () => {
    const issuance = await issued(tokenA);

    const { attempt } = await readActiveBody(tokenA);
    expect(attempt).toMatchObject({
      imageUrl: issuance.imageUrl,
      category: CATEGORY,
    });
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
      attemptRow({
        id: attemptId(4),
        day: today,
        kind: "replay",
        themeId: "gamma",
        status: "finalized",
        finalizeReason: "completed",
        score: 10,
      }),
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

  it("never draws a Theme no Editor published, however many Questions it holds", async () => {
    const drawn = new Set<string>();
    for (let round = 0; round < 20; round += 1) {
      attemptRows = [];
      drawn.add((await issued(tokenA)).themeId);
    }
    expect(drawn.has("secret")).toBe(false);
  });

  it("plays on rather than deny the day when the rotation excludes every eligible Theme", async () => {
    attemptRows.push(
      attemptRow({ id: attemptId(8), day: daysBefore(today, 1), themeId: "alpha" }),
      attemptRow({ id: attemptId(9), day: daysBefore(today, 1), kind: "replay", themeId: "beta" }),
      attemptRow({ id: attemptId(10), day: daysBefore(today, 2), themeId: "gamma" }),
      attemptRow({
        id: attemptId(11),
        day: today,
        kind: "replay",
        themeId: "delta",
        status: "finalized",
        finalizeReason: "completed",
        score: 10,
      }),
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

  describe("active Attempt read", () => {
    it("without a token → 401 UNAUTHENTICATED", async () => {
      const response = await fetch(`${baseUrl}/app/me/competition/attempts/active`);
      expect(response.status).toBe(401);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    });

    it("answers no Attempt when the Player has none in play", async () => {
      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
    });

    it("re-serves the Attempt exactly as it was issued, so a crashed session resumes", async () => {
      const first = await issued(tokenA);
      draws = [];

      const body = await readActiveBody(tokenA);
      expect(body.attempt).toEqual(first);
      expect(draws).toEqual([]);
    });

    it("resumes an Attempt the Catalog un-staged under it, Theme and Questions alike", async () => {
      const first = await issued(tokenA);
      unpublishedThemeIds.push(first.themeId);
      unreadyQuestionIds = first.questions.map((question: { id: string }) => question.id);
      draws = [];

      expect((await readActiveBody(tokenA)).attempt).toEqual(first);
      expect(draws).toEqual([]);
    });

    it("carries the Questions blank — no answer material, no answer the Player gave", async () => {
      await issued(tokenA);
      const body = await readActiveBody(tokenA);
      const wire = JSON.stringify(body);

      for (const question of body.attempt.questions as { id: string }[]) {
        expect(Object.keys(question)).toEqual(["id", "text", "squareChoices"]);
      }
      for (const source of QUESTIONS) {
        expect(wire).not.toContain(source.aliases[0]);
        expect(wire).not.toContain(source.misspellings[0]);
      }
    });

    it("a finalized Attempt is over, not in play", async () => {
      attemptRows.push(attemptRow({ status: "finalized", finalizeReason: "completed", score: 12 }));

      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
    });

    it("another Player's Attempt is never the one in play here", async () => {
      attemptRows.push(attemptRow({ owner: PLAYER_B }));

      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
    });
  });

  describe("lazy expiry", () => {
    const abandoned = (overrides: Partial<CompetitionAttemptEntity> = {}) =>
      attemptRow({
        id: JUDGED_ATTEMPT,
        day: daysBefore(today, 1),
        themeId: "france",
        themeName: "France",
        questionIds: JUDGED_IDS,
        ...overrides,
      });

    const expectZeroFinalized = () => {
      expect(attemptRows[0]).toMatchObject({
        status: "finalized",
        finalizeReason: "expired",
        score: 0,
      });
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(
        answerRows.every(
          (answer) =>
            answer.mode === QuizAnswerModeEnum.NONE &&
            answer.points === 0 &&
            answer.rawInput === null &&
            answer.correct === false,
        ),
      ).toBe(true);
    };

    it("the read buries a past-day Attempt before it answers", async () => {
      attemptRows.push(abandoned());

      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
      expectZeroFinalized();
    });

    it("issuing today's Attempt buries the day the Player went silent on", async () => {
      attemptRows.push(abandoned());

      expect((await issued(tokenA)).day).toBe(today);
      expectZeroFinalized();
    });

    it("an Attempt lives to the Europe/Paris midnight, not the UTC one", async () => {
      attemptRows.push(abandoned({ day: today }));

      now = new Date("2026-08-20T21:59:59.000Z");
      expect((await readActiveBody(tokenA)).attempt).toMatchObject({ id: JUDGED_ATTEMPT });
      expect(attemptRows[0].status).toBe("active");

      now = new Date("2026-08-20T22:00:00.000Z");
      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
      expectZeroFinalized();
    });

    it("finalizing a dead day is refused, and the zeros it stored stand", async () => {
      attemptRows.push(abandoned());

      const response = await finalize(tokenA, []);
      expect(response.status).toBe(409);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("ATTEMPT_EXPIRED");
      expectZeroFinalized();
    });

    it("buries a dead day even when the Catalog has since dropped one of its Questions", async () => {
      attemptRows.push(abandoned({ questionIds: ["disparue-q0", ...JUDGED_IDS.slice(1)] }));

      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
      expectZeroFinalized();
    });

    it("another Player's dead day is not this Player's to bury", async () => {
      attemptRows.push(abandoned({ id: attemptId(30), owner: PLAYER_B }));

      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
      expect(attemptRows[0].status).toBe("active");
      expect(answerRows).toEqual([]);
    });

    it("a finalize the burial beat is refused, never answered with the zeros", async () => {
      attemptRows.push(abandoned({ day: today }));
      // The Player crossed the Paris midnight mid-request, and the other device buried the day first.
      racingFinalize = {
        reason: "expired",
        score: 0,
        answers: JUDGED_IDS.map((questionId, position) => ({
          attemptId: JUDGED_ATTEMPT,
          position,
          questionId,
          mode: QuizAnswerModeEnum.NONE,
          rawInput: null,
          correct: false,
          points: 0,
          matchedVia: null,
          clientElapsedMs: null,
        })),
      };

      const response = await finalize(tokenA, []);
      expect(response.status).toBe(409);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("ATTEMPT_EXPIRED");
      expectZeroFinalized();
    });

    it("retrying that finalize is refused again — an expired Attempt hands back nothing", async () => {
      attemptRows.push(abandoned({ status: "finalized", finalizeReason: "expired", score: 0 }));

      const response = await finalize(tokenA, []);
      expect(response.status).toBe(409);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("ATTEMPT_EXPIRED");
      expect(answerRows).toEqual([]);
    });
  });

  describe("finalize", () => {
    const played = (
      position: number,
      rawInput: string,
      mode: QuizAnswerModeEnum = QuizAnswerModeEnum.CASH,
    ) => ({
      questionId: JUDGED_IDS[position],
      mode,
      rawInput,
      clientElapsedMs: 4200 + position,
    });

    const finalized = async (token: string, answers: unknown[], id: string = JUDGED_ATTEMPT) => {
      const response = await finalize(token, answers, id);
      expect(response.status).toBe(200);
      return await response.json();
    };

    const fullBatch = () => [
      played(0, "Paris"),
      played(1, "Palais de l'Élysée"),
      played(2, "USA"),
      played(3, "maliera"),
      played(4, "1799"),
      played(5, "versingetorix"),
      played(6, "krisantème"),
      played(7, "Seine", QuizAnswerModeEnum.SQUARE),
      played(8, "faux-a-8", QuizAnswerModeEnum.SQUARE),
      played(9, "Or"),
    ];

    beforeEach(() => {
      attemptRows.push(
        attemptRow({
          id: JUDGED_ATTEMPT,
          themeId: "france",
          themeName: "France",
          questionIds: JUDGED_IDS,
        }),
      );
    });

    it("without a token → 401 UNAUTHENTICATED", async () => {
      const response = await fetch(
        `${baseUrl}/app/me/competition/attempts/${JUDGED_ATTEMPT}/finalize`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" },
      );
      expect(response.status).toBe(401);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    });

    it("carries the judged verdicts, the rules that fired and the score over the wire", async () => {
      const body = await finalized(tokenA, fullBatch());

      expect(
        body.answers.map((answer: { matchedVia: string | null }) => answer.matchedVia),
      ).toEqual([
        UserAnswerMatchedViaEnum.CANONICAL,
        UserAnswerMatchedViaEnum.ALIAS,
        UserAnswerMatchedViaEnum.ALIAS,
        UserAnswerMatchedViaEnum.FUZZY,
        null,
        UserAnswerMatchedViaEnum.FUZZY,
        UserAnswerMatchedViaEnum.MISSPELLING,
        UserAnswerMatchedViaEnum.CHOICE,
        null,
        UserAnswerMatchedViaEnum.CANONICAL,
      ]);
      expect(body.answers.map((answer: { points: number }) => answer.points)).toEqual([
        COMPETITION_POINTS.cash,
        COMPETITION_POINTS.cash,
        COMPETITION_POINTS.cash,
        COMPETITION_POINTS.cash,
        0,
        COMPETITION_POINTS.cash,
        COMPETITION_POINTS.cash,
        COMPETITION_POINTS.square,
        0,
        COMPETITION_POINTS.cash,
      ]);
      expect(body.score).toBe(COMPETITION_POINTS.cash * 7 + COMPETITION_POINTS.square);
      expect(attemptRows[0].score).toBe(body.score);
    });

    it("reveals the Canonical Answer with the verdict — the results screen ends the Attempt", async () => {
      const body = await finalized(tokenA, fullBatch());

      expect(body.answers[0]).toMatchObject({
        position: 0,
        questionId: JUDGED_IDS[0],
        questionText: JUDGED_QUESTIONS[0].text,
        canonicalAnswer: "Paris",
        rawInput: "Paris",
      });
      expect(
        body.answers.map((answer: { canonicalAnswer: string }) => answer.canonicalAnswer),
      ).toEqual(JUDGED_QUESTIONS.map((question) => question.answer));
    });

    it("carries the Theme visuals the Attempt was issued with", async () => {
      const body = await finalized(tokenA, fullBatch());

      expect(body).toMatchObject({
        themeName: "France",
        imageUrl: expectedImageUrl("france"),
        category: CATEGORY,
      });
    });

    it("stores the ten judged rows and marks the Attempt completed", async () => {
      const body = await finalized(tokenA, fullBatch());

      expect(body).toMatchObject({ finalizeReason: "completed", themeId: "france" });
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(answerRows[7]).toMatchObject({
        attemptId: JUDGED_ATTEMPT,
        position: 7,
        questionId: JUDGED_IDS[7],
        mode: QuizAnswerModeEnum.SQUARE,
        rawInput: "Seine",
        matchedVia: UserAnswerMatchedViaEnum.CHOICE,
        clientElapsedMs: 4207,
      });
      expect(attemptRows[0]).toMatchObject({ status: "finalized", finalizeReason: "completed" });
    });

    it("rejects a batch whose answer targets a Question the Attempt never served", async () => {
      const batch = fullBatch();
      batch[3] = { ...played(3, "Molière"), questionId: "alpha-q3" };

      const response = await finalize(tokenA, batch);
      expect(response.status).toBe(400);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("ANSWER_NOT_SERVED");
      expect(answerRows).toEqual([]);
      expect(attemptRows[0].status).toBe("active");
    });

    it("rejects an answer landing on the wrong served position", async () => {
      const batch = fullBatch();
      [batch[0], batch[1]] = [batch[1], batch[0]];

      expect((await finalize(tokenA, batch)).status).toBe(400);
      expect(attemptRows[0].status).toBe("active");
    });

    it("retrying is a no-op that returns the stored transcript", async () => {
      const first = await finalized(tokenA, fullBatch());
      const retry = await finalized(tokenA, fullBatch());
      expect(retry).toEqual(first);

      // Even a different batch loses to what the Attempt already stored.
      const contradicting = await finalized(tokenA, [played(0, "Lyon")]);
      expect(contradicting).toEqual(first);
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(attemptRows[0].finalizeReason).toBe("completed");
    });

    it("a partial batch is a quit: the rest scores 0 and the Attempt is consumed", async () => {
      const body = await finalized(tokenA, [played(0, "Paris"), played(2, "USA")].slice(0, 1));

      expect(body).toMatchObject({ finalizeReason: "quit", score: COMPETITION_POINTS.cash });
      expect(body.answers).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(body.answers[1]).toMatchObject({
        position: 1,
        questionId: JUDGED_IDS[1],
        mode: QuizAnswerModeEnum.NONE,
        rawInput: null,
        correct: false,
        points: 0,
        matchedVia: null,
      });
      expect(attemptRows[0]).toMatchObject({ status: "finalized", finalizeReason: "quit" });
    });

    it("an empty batch zero-fills the whole Attempt and still consumes it", async () => {
      const body = await finalized(tokenA, []);

      expect(body).toMatchObject({ finalizeReason: "quit", score: 0 });
      expect(
        body.answers.every(
          (answer: { mode: QuizAnswerModeEnum }) => answer.mode === QuizAnswerModeEnum.NONE,
        ),
      ).toBe(true);
      expect(attemptRows[0].status).toBe("finalized");
    });

    it("another Player's Attempt is not found", async () => {
      const response = await finalize(tokenB, fullBatch());
      expect(response.status).toBe(404);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("NOT_FOUND");
      expect(attemptRows[0].status).toBe("active");
    });

    it("an unknown Attempt is not found, and an id that is not one is refused", async () => {
      expect((await finalize(tokenA, fullBatch(), attemptId(77))).status).toBe(404);
      expect((await finalize(tokenA, fullBatch(), "not-a-uuid")).status).toBe(400);
    });

    it("two devices finalizing at once share the transcript the first one stored", async () => {
      // The other device quit after one answer, and that is the Attempt's whole transcript.
      racingFinalize = {
        reason: "quit",
        score: COMPETITION_POINTS.cash,
        answers: JUDGED_IDS.map((questionId, position) =>
          position === 0
            ? {
                attemptId: JUDGED_ATTEMPT,
                position,
                questionId,
                mode: QuizAnswerModeEnum.CASH,
                rawInput: "Ville Lumière",
                correct: true,
                points: COMPETITION_POINTS.cash,
                matchedVia: UserAnswerMatchedViaEnum.ALIAS,
                clientElapsedMs: 1000,
              }
            : {
                attemptId: JUDGED_ATTEMPT,
                position,
                questionId,
                mode: QuizAnswerModeEnum.NONE,
                rawInput: null,
                correct: false,
                points: 0,
                matchedVia: null,
                clientElapsedMs: null,
              },
        ),
      };

      const body = await finalized(tokenA, fullBatch());
      expect(body).toMatchObject({ finalizeReason: "quit", score: COMPETITION_POINTS.cash });
      expect(body.answers[0]).toMatchObject({
        rawInput: "Ville Lumière",
        matchedVia: UserAnswerMatchedViaEnum.ALIAS,
      });
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
    });
  });

  describe("standing", () => {
    let scoredAttempts = 0;
    beforeEach(() => {
      scoredAttempts = 0;
    });

    const scored = (
      day: string,
      score: number,
      overrides: Partial<CompetitionAttemptEntity> = {},
    ) => {
      scoredAttempts += 1;
      return attemptRow({
        id: attemptId(50 + scoredAttempts),
        day,
        status: "finalized",
        finalizeReason: "completed",
        score,
        ...overrides,
      });
    };

    it("GET /app/me/competition/standing without a token → 401 UNAUTHENTICATED", async () => {
      const response = await fetch(`${baseUrl}/app/me/competition/standing`);
      expect(response.status).toBe(401);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    });

    it("reports an empty season before the Player's first Attempt", async () => {
      expect(await standing(tokenA)).toEqual({ season: "2026-08", seasonTotal: 0, days: [] });
    });

    it("keeps the better of the day's two Attempts, and a quit's partial score competes", async () => {
      attemptRows.push(
        scored(today, 20),
        scored(today, 35, { kind: "replay", finalizeReason: "quit" }),
        scored(daysBefore(today, 1), 15, { finalizeReason: "quit" }),
      );

      expect(await standing(tokenA)).toEqual({
        season: "2026-08",
        seasonTotal: 50,
        days: [
          { day: daysBefore(today, 1), score: 15 },
          { day: today, score: 35 },
        ],
      });
    });

    it("keeps the initial Attempt when the Replay scored worse", async () => {
      attemptRows.push(scored(today, 40), scored(today, 5, { kind: "replay" }));

      expect(await standing(tokenA)).toMatchObject({
        seasonTotal: 40,
        days: [{ day: today, score: 40 }],
      });
    });

    it("lands Catch-up points on yesterday's Competition Day", async () => {
      const yesterday = daysBefore(today, 1);
      attemptRows.push(scored(today, 10), scored(yesterday, 25, { kind: "catchup" }));

      expect(await standing(tokenA)).toEqual({
        season: "2026-08",
        seasonTotal: 35,
        days: [
          { day: yesterday, score: 25 },
          { day: today, score: 10 },
        ],
      });
    });

    it("counts no Attempt still in play, and buries a past-day one at 0 first", async () => {
      attemptRows.push(
        scored(today, 30),
        attemptRow({ id: JUDGED_ATTEMPT, day: daysBefore(today, 1), questionIds: JUDGED_IDS }),
      );

      expect(await standing(tokenA)).toEqual({
        season: "2026-08",
        seasonTotal: 30,
        days: [
          { day: daysBefore(today, 1), score: 0 },
          { day: today, score: 30 },
        ],
      });
    });

    it("sums this month alone — the season stops at the Europe/Paris month edges", async () => {
      attemptRows.push(
        scored("2026-07-31", 50),
        scored("2026-08-01", 20),
        scored("2026-08-31", 30),
        scored("2026-09-01", 45),
      );

      expect(await standing(tokenA)).toEqual({
        season: "2026-08",
        seasonTotal: 50,
        days: [
          { day: "2026-08-01", score: 20 },
          { day: "2026-08-31", score: 30 },
        ],
      });
    });

    it("turns the season over at the Europe/Paris month edge, not the UTC one", async () => {
      attemptRows.push(scored("2026-08-31", 30), scored("2026-09-01", 45));

      now = new Date("2026-08-31T21:59:59.000Z");
      expect(await standing(tokenA)).toMatchObject({ season: "2026-08", seasonTotal: 30 });

      now = new Date("2026-08-31T22:00:00.000Z");
      expect(await standing(tokenA)).toMatchObject({ season: "2026-09", seasonTotal: 45 });
    });

    it("another Player's Attempts never enter this Player's season", async () => {
      attemptRows.push(scored(today, 30), scored(today, 50, { owner: PLAYER_B }));

      expect(await standing(tokenA)).toMatchObject({
        seasonTotal: 30,
        days: [{ day: today, score: 30 }],
      });
      expect(await standing(tokenB)).toMatchObject({
        seasonTotal: 50,
        days: [{ day: today, score: 50 }],
      });
    });

    it("derives at read: the Attempt finalized between two reads is in the second", async () => {
      expect(await standing(tokenA)).toMatchObject({ seasonTotal: 0 });

      attemptRows.push(scored(today, 25));

      expect(await standing(tokenA)).toMatchObject({
        seasonTotal: 25,
        days: [{ day: today, score: 25 }],
      });
    });
  });

  describe("replay", () => {
    const judgedInitial = (score = 20) =>
      attemptRow({
        id: attemptId(40),
        day: today,
        status: "finalized",
        finalizeReason: "completed",
        score,
      });

    beforeEach(() => {
      premiumUntilByOwner.set(PLAYER_A, new Date(Date.now() + HOUR_MS));
    });

    it("refuses a free Account with 403 PREMIUM_REQUIRED, and issues nothing", async () => {
      premiumUntilByOwner.clear();
      attemptRows.push(judgedInitial());

      const response = await issue(tokenA, "replay");
      expect(response.status).toBe(403);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("PREMIUM_REQUIRED");
      expect(issuedAttempts).toEqual([]);
      expect(attemptRows).toHaveLength(1);
    });

    it("a lapsed subscription is free tier at once — a past expiry is refused the same way", async () => {
      premiumUntilByOwner.set(PLAYER_A, new Date(Date.now() - HOUR_MS));
      attemptRows.push(judgedInitial());

      expect((await issue(tokenA, "replay")).status).toBe(403);
      expect(issuedAttempts).toEqual([]);
    });

    it("follows the judged initial only: none today, or one still in play, is refused", async () => {
      expect((await issue(tokenA, "replay")).status).toBe(409);

      attemptRows.push(attemptRow({ id: attemptId(41), day: today }));
      const response = await issue(tokenA, "replay");
      expect(response.status).toBe(409);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("CONFLICT");
      expect(issuedAttempts).toEqual([]);
    });

    it("issues a second Attempt on a fresh Theme, attributed to today", async () => {
      attemptRows.push(judgedInitial());

      const body = await issued(tokenA, "replay");
      expect(body).toMatchObject({ day: today, kind: "replay", status: "active" });
      expect(body.themeId).not.toBe("alpha");
      expect(body.questions).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(draws).toEqual([{ themeId: body.themeId, count: COMPETITION_QUESTION_COUNT }]);
      expect(attemptRows[1]).toMatchObject({ owner: PLAYER_A, day: today, kind: "replay" });
    });

    it("draws around the initial's Theme as it does around the two days before", async () => {
      attemptRows.push(
        judgedInitial(),
        attemptRow({ id: attemptId(41), day: daysBefore(today, 1), themeId: "beta" }),
        attemptRow({ id: attemptId(42), day: daysBefore(today, 2), themeId: "gamma" }),
      );

      expect((await issued(tokenA, "replay")).themeId).toBe("delta");
    });

    it("re-asking the same day serves the same Replay — one per Competition Day", async () => {
      attemptRows.push(judgedInitial());
      const first = await issued(tokenA, "replay");
      draws = [];
      issuedAttempts = [];

      const second = await issued(tokenA, "replay");
      expect(second).toEqual(first);
      expect(draws).toEqual([]);
      expect(issuedAttempts).toEqual([]);
      expect(attemptRows).toHaveLength(2);
    });

    it("the day keeps the best of its two Attempts through the standing", async () => {
      attemptRows.push(judgedInitial(20));
      const body = await issued(tokenA, "replay");

      const response = await finalize(tokenA, correctBatch(body), body.id);
      expect(response.status).toBe(200);
      expect((await response.json()).score).toBe(
        COMPETITION_POINTS.cash * COMPETITION_QUESTION_COUNT,
      );
      expect(await standing(tokenA)).toMatchObject({
        seasonTotal: 50,
        days: [{ day: today, score: 50 }],
      });
    });

    it("a Replay scoring worse leaves the day on its initial score", async () => {
      attemptRows.push(judgedInitial(20));
      const body = await issued(tokenA, "replay");

      expect((await finalize(tokenA, [], body.id)).status).toBe(200);
      expect(await standing(tokenA)).toMatchObject({ days: [{ day: today, score: 20 }] });
    });

    it("a subscription lapsing mid-session still resumes and judges the Replay it issued", async () => {
      attemptRows.push(judgedInitial());
      const body = await issued(tokenA, "replay");
      premiumUntilByOwner.clear();

      expect((await readActiveBody(tokenA)).attempt).toMatchObject({
        id: body.id,
        kind: "replay",
      });
      expect((await finalize(tokenA, correctBatch(body), body.id)).status).toBe(200);
    });

    it("is refused while another Attempt is still in play", async () => {
      attemptRows.push(
        judgedInitial(),
        attemptRow({
          id: attemptId(42),
          day: daysBefore(today, 1),
          kind: "catchup",
          issuedAt: now,
        }),
      );

      expect((await issue(tokenA, "replay")).status).toBe(409);
      expect(issuedAttempts).toEqual([]);
    });

    it("two devices asking at once share the single Replay the day allows", async () => {
      attemptRows.push(judgedInitial());
      racingAttempt = attemptRow({
        id: attemptId(43),
        day: today,
        kind: "replay",
        themeId: "beta",
        themeName: "Beta",
        questionIds: servedIds("beta"),
      });

      const body = await issued(tokenA, "replay");
      expect(body.id).toBe(attemptId(43));
      expect(attemptRows).toHaveLength(2);
    });
  });

  describe("catch-up", () => {
    const yesterday = daysBefore(today, 1);

    beforeEach(() => {
      premiumUntilByOwner.set(PLAYER_A, new Date(Date.now() + HOUR_MS));
    });

    it("refuses a free Account with 403 PREMIUM_REQUIRED, and issues nothing", async () => {
      premiumUntilByOwner.clear();

      const response = await issue(tokenA, "catchup");
      expect(response.status).toBe(403);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("PREMIUM_REQUIRED");
      expect(issuedAttempts).toEqual([]);
    });

    it("fills an empty yesterday only: any Attempt already there is refused", async () => {
      attemptRows.push(
        attemptRow({
          id: attemptId(44),
          day: yesterday,
          status: "finalized",
          finalizeReason: "quit",
          score: 5,
        }),
      );

      const response = await issue(tokenA, "catchup");
      expect(response.status).toBe(409);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("CONFLICT");
      expect(issuedAttempts).toEqual([]);
    });

    it("is refused on the first day of a month — yesterday belongs to another season", async () => {
      now = new Date("2026-09-01T12:00:00.000Z");

      expect((await issue(tokenA, "catchup")).status).toBe(409);
      expect(issuedAttempts).toEqual([]);
    });

    it("issues an Attempt attributed to yesterday, drawn around J-2 and today's Themes", async () => {
      attemptRows.push(
        attemptRow({
          id: attemptId(45),
          day: daysBefore(today, 2),
          status: "finalized",
          finalizeReason: "completed",
          score: 10,
        }),
        attemptRow({
          id: attemptId(46),
          day: today,
          status: "finalized",
          finalizeReason: "completed",
          score: 10,
          themeId: "beta",
          themeName: "Beta",
          questionIds: servedIds("beta"),
        }),
      );

      const body = await issued(tokenA, "catchup");
      expect(body).toMatchObject({ day: yesterday, kind: "catchup", status: "active" });
      expect(["gamma", "delta"]).toContain(body.themeId);
      expect(attemptRows[2]).toMatchObject({ owner: PLAYER_A, day: yesterday, kind: "catchup" });
    });

    it("stays in play until tomorrow's Paris midnight, not yesterday's", async () => {
      const body = await issued(tokenA, "catchup");

      now = new Date("2026-08-20T21:59:59.000Z");
      expect((await readActiveBody(tokenA)).attempt).toMatchObject({
        id: body.id,
        kind: "catchup",
      });
      expect(attemptRows[0].status).toBe("active");

      now = new Date("2026-08-20T22:00:00.000Z");
      expect(await readActiveBody(tokenA)).toEqual({ attempt: null });
      expect(attemptRows[0]).toMatchObject({
        status: "finalized",
        finalizeReason: "expired",
        day: yesterday,
      });
    });

    it("re-asking serves the same Catch-up — yesterday admits one, and no Replay of it", async () => {
      const first = await issued(tokenA, "catchup");
      draws = [];

      expect(await issued(tokenA, "catchup")).toEqual(first);
      expect(draws).toEqual([]);
      expect(attemptRows).toHaveLength(1);
    });

    it("lands its points on yesterday through the standing", async () => {
      const body = await issued(tokenA, "catchup");

      expect((await finalize(tokenA, correctBatch(body), body.id)).status).toBe(200);
      expect(await standing(tokenA)).toEqual({
        season: "2026-08",
        seasonTotal: 50,
        days: [{ day: yesterday, score: 50 }],
      });
    });

    it("a subscription lapsing mid-session still judges the Catch-up it issued", async () => {
      const body = await issued(tokenA, "catchup");
      premiumUntilByOwner.clear();

      expect((await finalize(tokenA, correctBatch(body), body.id)).status).toBe(200);
      expect(attemptRows[0]).toMatchObject({ status: "finalized", finalizeReason: "completed" });
    });

    it("is refused while today's Attempt is still in play", async () => {
      attemptRows.push(attemptRow({ id: attemptId(47), day: today }));

      expect((await issue(tokenA, "catchup")).status).toBe(409);
      expect(issuedAttempts).toEqual([]);
    });

    it("holds the door for one Attempt: a fresh initial waits until the Catch-up is judged", async () => {
      await issued(tokenA, "catchup");
      issuedAttempts = [];

      expect((await issue(tokenA, "initial")).status).toBe(409);
      expect(issuedAttempts).toEqual([]);
    });

    it("two devices asking at once share the single Catch-up yesterday allows", async () => {
      racingAttempt = attemptRow({
        id: attemptId(48),
        day: yesterday,
        kind: "catchup",
        issuedAt: now,
      });

      const body = await issued(tokenA, "catchup");
      expect(body.id).toBe(attemptId(48));
      expect(attemptRows).toHaveLength(1);
    });
  });

  describe("day", () => {
    const yesterday = daysBefore(today, 1);
    const judged = (
      index: number,
      day: string,
      kind: CompetitionAttemptKind = "initial",
      score = 10,
    ) =>
      attemptRow({
        id: attemptId(index),
        day,
        kind,
        status: "finalized",
        finalizeReason: "completed",
        score,
      });

    it("GET /app/me/competition/day without a token → 401 UNAUTHENTICATED", async () => {
      const response = await fetch(`${baseUrl}/app/me/competition/day`);
      expect(response.status).toBe(401);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    });

    it("a fresh Player: no Replay before the initial is judged, a Catch-up for the empty yesterday", async () => {
      expect(await readDay(tokenA)).toEqual({
        day: today,
        replay: false,
        catchup: true,
        attempts: [],
      });
    });

    it("offers the Replay once the initial is judged, and withdraws it once the Replay is", async () => {
      attemptRows.push(attemptRow({ id: attemptId(60), day: today }));
      expect((await readDay(tokenA)).replay).toBe(false);

      attemptRows = [judged(61, today)];
      expect((await readDay(tokenA)).replay).toBe(true);

      attemptRows.push(attemptRow({ id: attemptId(62), day: today, kind: "replay" }));
      expect((await readDay(tokenA)).replay).toBe(true);

      attemptRows = [judged(61, today), judged(63, today, "replay")];
      expect((await readDay(tokenA)).replay).toBe(false);
    });

    it("withholds the Catch-up once yesterday holds an Attempt, but keeps one still in play", async () => {
      attemptRows.push(judged(64, yesterday));
      expect((await readDay(tokenA)).catchup).toBe(false);

      attemptRows = [
        attemptRow({ id: attemptId(65), day: yesterday, kind: "catchup", issuedAt: now }),
      ];
      expect((await readDay(tokenA)).catchup).toBe(true);

      attemptRows = [judged(66, yesterday, "catchup")];
      expect((await readDay(tokenA)).catchup).toBe(false);
    });

    it("lists today's judged Attempts with their scores, the one still in play left out", async () => {
      attemptRows.push(
        judged(70, today, "initial", 20),
        attemptRow({ id: attemptId(71), day: today, kind: "replay" }),
      );
      expect((await readDay(tokenA)).attempts).toEqual([
        { id: attemptId(70), kind: "initial", score: 20 },
      ]);

      attemptRows = [judged(70, today, "initial", 20), judged(72, today, "replay", 35)];
      expect((await readDay(tokenA)).attempts).toEqual([
        { id: attemptId(70), kind: "initial", score: 20 },
        { id: attemptId(72), kind: "replay", score: 35 },
      ]);
    });

    it("keeps yesterday's Attempts out of today's list, a judged Catch-up included", async () => {
      attemptRows.push(judged(73, yesterday), judged(74, yesterday, "catchup"));

      expect((await readDay(tokenA)).attempts).toEqual([]);
    });

    it("withholds the Catch-up on the first day of a month", async () => {
      now = new Date("2026-09-01T12:00:00.000Z");

      expect(await readDay(tokenA)).toEqual({
        day: "2026-09-01",
        replay: false,
        catchup: false,
        attempts: [],
      });
    });

    it("buries a dead day before answering, so the day it filled offers no Catch-up", async () => {
      attemptRows.push(attemptRow({ id: JUDGED_ATTEMPT, day: yesterday, questionIds: JUDGED_IDS }));

      expect(await readDay(tokenA)).toEqual({
        day: today,
        replay: false,
        catchup: false,
        attempts: [],
      });
      expect(attemptRows[0]).toMatchObject({ status: "finalized", finalizeReason: "expired" });
    });

    it("never reads another Player's day", async () => {
      attemptRows.push(judged(67, today), judged(68, yesterday));

      expect(await readDay(tokenB)).toEqual({
        day: today,
        replay: false,
        catchup: true,
        attempts: [],
      });
    });
  });
});
