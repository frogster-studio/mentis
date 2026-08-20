import { COMPETITION_POINTS, COMPETITION_QUESTION_COUNT } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import type {
  CompetitionAttemptEntity,
  CompetitionFinalizeReason,
} from "../../_database/entities/competition-attempt.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import {
  CatalogRepository,
  type DrawnQuestion,
} from "../../catalog/repositories/catalog.repository";
import {
  CompetitionRepository,
  type FinalizedOutcome,
} from "../repositories/competition.repository";
import { CLOCK } from "../services/clock";
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

const PARIS_AFTERNOON = new Date("2026-08-20T12:00:00.000Z");
let now = PARIS_AFTERNOON;
let attemptRows: CompetitionAttemptEntity[] = [];
let draws: { themeId: string | null; count: number }[] = [];
let issuedAttempts: { owner: string; day: string; kind: string }[] = [];
let ineligibleThemeIds: string[] = [];
let racingAttempt: CompetitionAttemptEntity | null = null;
let answerRows: CompetitionAnswerEntity[] = [];
let racingFinalize: FinalizedOutcome | null = null;

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
    return [...QUESTIONS, ...JUDGED_QUESTIONS].filter((question) => ids.includes(question.id));
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
  async findOwnedAttempt(id, owner) {
    return attemptRows.find((row) => row.id === id && row.owner === owner) ?? null;
  },
  async findActiveAttempts(owner) {
    return attemptRows
      .filter((row) => row.owner === owner && row.status === "active")
      .sort((left, right) => right.issuedAt.getTime() - left.issuedAt.getTime());
  },
  async findAnswers(id) {
    return answerRows
      .filter((row) => row.attemptId === id)
      .sort((left, right) => left.position - right.position);
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
  | "findActiveAttempts"
  | "findAnswers"
  | "finalize"
>;

const applyFinalize = (
  id: string,
  reason: CompetitionFinalizeReason,
  score: number,
  answers: CompetitionAnswerEntity[],
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

  const readActive = (token: string) =>
    fetch(`${baseUrl}/app/me/competition/attempts/active`, {
      headers: { Authorization: `Bearer ${token}` },
    });

  const readActiveBody = async (token: string) => {
    const response = await readActive(token);
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
    racingAttempt = null;
    answerRows = [];
    racingFinalize = null;
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
            answer.mode === "none" &&
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
          mode: "none",
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
    const played = (position: number, rawInput: string, mode: "cash" | "square" = "cash") => ({
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
      played(7, "Seine", "square"),
      played(8, "faux-a-8", "square"),
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
        "canonical",
        "alias",
        "alias",
        "fuzzy",
        null,
        "fuzzy",
        "misspelling",
        "choice",
        null,
        "canonical",
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

    it("stores the ten judged rows and marks the Attempt completed", async () => {
      const body = await finalized(tokenA, fullBatch());

      expect(body).toMatchObject({ finalizeReason: "completed", themeId: "france" });
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
      expect(answerRows[7]).toMatchObject({
        attemptId: JUDGED_ATTEMPT,
        position: 7,
        questionId: JUDGED_IDS[7],
        mode: "square",
        rawInput: "Seine",
        matchedVia: "choice",
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
        mode: "none",
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
      expect(body.answers.every((answer: { mode: string }) => answer.mode === "none")).toBe(true);
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
                mode: "cash",
                rawInput: "Ville Lumière",
                correct: true,
                points: COMPETITION_POINTS.cash,
                matchedVia: "alias",
                clientElapsedMs: 1000,
              }
            : {
                attemptId: JUDGED_ATTEMPT,
                position,
                questionId,
                mode: "none",
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
      expect(body.answers[0]).toMatchObject({ rawInput: "Ville Lumière", matchedVia: "alias" });
      expect(answerRows).toHaveLength(COMPETITION_QUESTION_COUNT);
    });
  });
});
