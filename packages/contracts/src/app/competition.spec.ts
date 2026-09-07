import { describe, expect, it } from "vitest";
import { QuizAnswerModeEnum, UserAnswerMatchedViaEnum } from "../enums";
import {
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionDayResponseSchema,
  appCompetitionFinalizeInputSchema,
  appCompetitionIssueInputSchema,
  appCompetitionLeaderboardPageResponseSchema,
  appCompetitionStandingLegacyResponseSchema,
  appCompetitionStandingResponseSchema,
  appCompetitionTranscriptResponseSchema,
  COMPETITION_POINTS,
  COMPETITION_QUESTION_COUNT,
  LEADERBOARD_PAGE_SIZE,
} from "./index";

const question = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `q${index}`,
  text: `Question ${index} ?`,
  squareChoices: ["Paris", "Lyon", "Nice", "Brest"],
  ...overrides,
});

const CATEGORY = { id: "nature", name: "Nature", color: "#2e7d32", icon: "park" };
const IMAGE_URL = "https://cdn.example.com/storage/v1/object/public/theme-images/geo.webp";

const attempt = (overrides: Record<string, unknown> = {}) => ({
  id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  day: "2026-08-20",
  kind: "initial",
  status: "active",
  themeId: "geo",
  themeName: "Géographie",
  imageUrl: IMAGE_URL,
  category: CATEGORY,
  questions: Array.from({ length: COMPETITION_QUESTION_COUNT }, (_, index) => question(index)),
  ...overrides,
});

describe("appCompetitionAttemptResponseSchema", () => {
  it("strips the answer material — none of it belongs on the wire", () => {
    const parsed = appCompetitionAttemptResponseSchema.parse(
      attempt({
        questions: [
          question(0, { answer: "Paris", aliases: ["Lutèce"], misspellings: ["Pariss"] }),
          ...Array.from({ length: COMPETITION_QUESTION_COUNT - 1 }, (_, index) =>
            question(index + 1),
          ),
        ],
      }),
    );
    expect(JSON.stringify(parsed)).not.toContain("Lutèce");
    expect(parsed.questions[0]).toEqual({
      id: "q0",
      text: "Question 0 ?",
      squareChoices: ["Paris", "Lyon", "Nice", "Brest"],
    });
  });

  it("holds exactly 10 Questions of 4 choices each", () => {
    expect(
      appCompetitionAttemptResponseSchema.safeParse(attempt({ questions: [question(0)] })).success,
    ).toBe(false);
    expect(
      appCompetitionAttemptResponseSchema.safeParse(
        attempt({
          questions: [
            question(0, { squareChoices: ["Paris", "Lyon", "Nice"] }),
            ...Array.from({ length: COMPETITION_QUESTION_COUNT - 1 }, (_, index) =>
              question(index + 1),
            ),
          ],
        }),
      ).success,
    ).toBe(false);
  });

  it("carries the drawn Theme's visuals, so the phone never joins on its cached list", () => {
    const parsed = appCompetitionAttemptResponseSchema.parse(attempt());
    expect(parsed.imageUrl).toBe(IMAGE_URL);
    expect(parsed.category).toEqual(CATEGORY);
  });

  it("rejects an Attempt whose Theme carries no visuals", () => {
    expect(
      appCompetitionAttemptResponseSchema.safeParse(attempt({ imageUrl: "geo.webp" })).success,
    ).toBe(false);
    const { category: _dropped, ...withoutCategory } = attempt();
    expect(appCompetitionAttemptResponseSchema.safeParse(withoutCategory).success).toBe(false);
  });

  it("rejects a Competition Day that is not a plain Europe/Paris date", () => {
    expect(
      appCompetitionAttemptResponseSchema.safeParse(attempt({ day: "2026-08-20T00:00:00.000Z" }))
        .success,
    ).toBe(false);
  });
});

describe("appCompetitionActiveAttemptResponseSchema", () => {
  it("carries no Attempt at all — the Player has none in play", () => {
    expect(appCompetitionActiveAttemptResponseSchema.parse({ attempt: null }).attempt).toBeNull();
  });

  it("carries the issued Attempt whole, so the phone resumes on what it was served", () => {
    const parsed = appCompetitionActiveAttemptResponseSchema.parse({ attempt: attempt() });
    expect(parsed.attempt?.questions).toHaveLength(COMPETITION_QUESTION_COUNT);
    expect(parsed.attempt?.status).toBe("active");
  });

  it("rejects an Attempt that is not one", () => {
    expect(
      appCompetitionActiveAttemptResponseSchema.safeParse({
        attempt: attempt({ questions: [] }),
      }).success,
    ).toBe(false);
  });
});

const verdict = (index: number, overrides: Record<string, unknown> = {}) => ({
  position: index,
  questionId: `q${index}`,
  questionText: `Question ${index} ?`,
  canonicalAnswer: "Paris",
  mode: QuizAnswerModeEnum.CASH,
  rawInput: "paris",
  correct: true,
  points: COMPETITION_POINTS.cash,
  matchedVia: UserAnswerMatchedViaEnum.CANONICAL,
  ...overrides,
});

const transcript = (overrides: Record<string, unknown> = {}) => ({
  id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  day: "2026-08-20",
  kind: "initial",
  themeId: "geo",
  themeName: "Géographie",
  imageUrl: IMAGE_URL,
  category: CATEGORY,
  finalizeReason: "completed",
  score: COMPETITION_QUESTION_COUNT * COMPETITION_POINTS.cash,
  answers: Array.from({ length: COMPETITION_QUESTION_COUNT }, (_, index) => verdict(index)),
  ...overrides,
});

describe("appCompetitionFinalizeInputSchema", () => {
  const answer = (index: number, overrides: Record<string, unknown> = {}) => ({
    questionId: `q${index}`,
    mode: QuizAnswerModeEnum.CASH,
    rawInput: "paris",
    clientElapsedMs: 4200,
    ...overrides,
  });

  it("accepts a short batch — that is how a quit arrives", () => {
    const parsed = appCompetitionFinalizeInputSchema.parse({ answers: [answer(0), answer(1)] });
    expect(parsed.answers).toHaveLength(2);
    expect(appCompetitionFinalizeInputSchema.parse({ answers: [] }).answers).toEqual([]);
  });

  it("rejects a batch longer than the Attempt it answers", () => {
    const answers = Array.from({ length: COMPETITION_QUESTION_COUNT + 1 }, (_, index) =>
      answer(index),
    );
    expect(appCompetitionFinalizeInputSchema.safeParse({ answers }).success).toBe(false);
  });

  it("rejects a mode the phone cannot have played", () => {
    expect(
      appCompetitionFinalizeInputSchema.safeParse({
        answers: [answer(0, { mode: QuizAnswerModeEnum.NONE })],
      }).success,
    ).toBe(false);
  });

  it("strips a client-claimed verdict — the API judges, the phone reports", () => {
    const parsed = appCompetitionFinalizeInputSchema.parse({
      answers: [answer(0, { correct: true, points: 5 })],
    });
    expect(parsed.answers[0]).toEqual({
      questionId: "q0",
      mode: QuizAnswerModeEnum.CASH,
      rawInput: "paris",
      clientElapsedMs: 4200,
    });
  });
});

describe("appCompetitionTranscriptResponseSchema", () => {
  it("carries the Canonical Answer, the verdict and the rule that priced it", () => {
    const parsed = appCompetitionTranscriptResponseSchema.parse(transcript());
    expect(parsed.answers[0]).toMatchObject({
      canonicalAnswer: "Paris",
      matchedVia: UserAnswerMatchedViaEnum.CANONICAL,
      points: COMPETITION_POINTS.cash,
    });
  });

  it("carries the same Theme visuals the issuance served", () => {
    const parsed = appCompetitionTranscriptResponseSchema.parse(transcript());
    expect(parsed.imageUrl).toBe(IMAGE_URL);
    expect(parsed.category).toEqual(CATEGORY);
  });

  it("accepts an unresolved position — no mode, no input, no rule", () => {
    const parsed = appCompetitionTranscriptResponseSchema.parse(
      transcript({
        finalizeReason: "quit",
        score: 0,
        answers: Array.from({ length: COMPETITION_QUESTION_COUNT }, (_, index) =>
          verdict(index, {
            mode: QuizAnswerModeEnum.NONE,
            rawInput: null,
            correct: false,
            points: 0,
            matchedVia: null,
          }),
        ),
      }),
    );
    expect(parsed.answers[0].mode).toBe(QuizAnswerModeEnum.NONE);
  });

  it("holds a verdict for every served position and nothing above the Cash ceiling", () => {
    expect(
      appCompetitionTranscriptResponseSchema.safeParse(transcript({ answers: [verdict(0)] }))
        .success,
    ).toBe(false);
    expect(
      appCompetitionTranscriptResponseSchema.safeParse(
        transcript({ answers: [verdict(0, { points: 6 })] }),
      ).success,
    ).toBe(false);
  });

  it("rejects a score above the ten-Cash ceiling", () => {
    expect(
      appCompetitionTranscriptResponseSchema.safeParse(transcript({ score: 51 })).success,
    ).toBe(false);
  });
});

describe("appCompetitionStandingLegacyResponseSchema", () => {
  const standing = (overrides: Record<string, unknown> = {}) => ({
    season: "2026-08",
    seasonTotal: 45,
    days: [
      { day: "2026-08-19", score: 20 },
      { day: "2026-08-20", score: 25 },
    ],
    ...overrides,
  });

  it("carries the season, its day scores and their total", () => {
    expect(appCompetitionStandingLegacyResponseSchema.parse(standing())).toEqual(standing());
  });

  it("carries an empty season — the Player has played no Attempt this month", () => {
    const parsed = appCompetitionStandingLegacyResponseSchema.parse(
      standing({ seasonTotal: 0, days: [] }),
    );
    expect(parsed.days).toEqual([]);
  });

  it("rejects a day above the ten-Cash ceiling", () => {
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(
        standing({ days: [{ day: "2026-08-20", score: 51 }] }),
      ).success,
    ).toBe(false);
  });

  it("rejects a season that is not a plain Europe/Paris month", () => {
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(standing({ season: "2026-8" })).success,
    ).toBe(false);
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(standing({ season: "2026-08-20" }))
        .success,
    ).toBe(false);
  });

  it("rejects a month no calendar holds", () => {
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(standing({ season: "2026-00" })).success,
    ).toBe(false);
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(standing({ season: "2026-13" })).success,
    ).toBe(false);
    expect(
      appCompetitionStandingLegacyResponseSchema.parse(standing({ season: "2026-12" })).season,
    ).toBe("2026-12");
  });

  it("rejects a total above what a month of Attempts can hold", () => {
    expect(
      appCompetitionStandingLegacyResponseSchema.safeParse(standing({ seasonTotal: 1551 })).success,
    ).toBe(false);
  });
});

describe("appCompetitionIssueInputSchema", () => {
  it("accepts each of the three Attempt kinds", () => {
    for (const kind of ["initial", "replay", "catchup"]) {
      expect(appCompetitionIssueInputSchema.parse({ kind })).toEqual({ kind });
    }
  });

  it("rejects a kind the day never holds, and a missing one", () => {
    expect(appCompetitionIssueInputSchema.safeParse({ kind: "bonus" }).success).toBe(false);
    expect(appCompetitionIssueInputSchema.safeParse({}).success).toBe(false);
  });
});

describe("appCompetitionDayResponseSchema", () => {
  const dayAttempt = { id: "3f1d4d1e-0f4a-4c9b-9a1a-8f5c2b7d6e01", kind: "initial", score: 20 };

  it("carries the Competition Day, what it still allows and the Attempts it judged", () => {
    const day = { day: "2026-08-20", replay: true, catchup: false, attempts: [dayAttempt] };
    expect(appCompetitionDayResponseSchema.parse(day)).toEqual(day);
  });

  it("rejects a day that is not a plain Europe/Paris date", () => {
    expect(
      appCompetitionDayResponseSchema.safeParse({
        day: "2026-08-20T00:00:00.000Z",
        replay: false,
        catchup: false,
        attempts: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a judged Attempt above the ten-Cash ceiling or of an unknown kind", () => {
    const day = (attempt: object) => ({
      day: "2026-08-20",
      replay: false,
      catchup: false,
      attempts: [attempt],
    });
    expect(
      appCompetitionDayResponseSchema.safeParse(day({ ...dayAttempt, score: 51 })).success,
    ).toBe(false);
    expect(
      appCompetitionDayResponseSchema.safeParse(day({ ...dayAttempt, kind: "bonus" })).success,
    ).toBe(false);
  });
});

const rankedStanding = (overrides: Record<string, unknown> = {}) => ({
  season: "2026-09",
  seasonTotal: 412,
  rank: 12,
  rankedCount: 340,
  page: 1,
  ...overrides,
});

describe("appCompetitionStandingResponseSchema", () => {
  it("carries the Account's rank, population and page", () => {
    expect(appCompetitionStandingResponseSchema.parse(rankedStanding())).toEqual(rankedStanding());
  });

  it("accepts an unranked Account while retaining the ranked population", () => {
    const standing = rankedStanding({ seasonTotal: 0, rank: null, page: null });
    expect(appCompetitionStandingResponseSchema.parse(standing)).toEqual(standing);
  });

  it("accepts a ranked Account with a zero total", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(rankedStanding({ seasonTotal: 0 })).success,
    ).toBe(true);
  });

  it.each(["season", "seasonTotal", "rank", "rankedCount", "page"])("requires %s", (field) => {
    const standing: Record<string, unknown> = rankedStanding();
    delete standing[field];
    expect(appCompetitionStandingResponseSchema.safeParse(standing).success).toBe(false);
  });

  it("rejects days even when all Standing fields are present", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(rankedStanding({ days: [] })).success,
    ).toBe(false);
  });

  it.each([
    { season: "2026-13" },
    { seasonTotal: -1 },
    { seasonTotal: 1.5 },
    { seasonTotal: 1551 },
    { rank: -1 },
    { rank: 0 },
    { rank: 1.5 },
    { rankedCount: -1 },
    { rankedCount: 1.5 },
    { page: 0 },
    { page: 1.5 },
  ])("rejects invalid Standing fields: %j", (overrides) => {
    expect(appCompetitionStandingResponseSchema.safeParse(rankedStanding(overrides)).success).toBe(
      false,
    );
  });
});

const leaderboardPage = (overrides: Record<string, unknown> = {}) => ({
  season: "2026-09",
  page: 1,
  pageCount: 1,
  entries: [{ rank: 1, pseudo: "Player_42", seasonTotal: 412 }],
  ...overrides,
});

describe("appCompetitionLeaderboardPageResponseSchema", () => {
  it("carries a page's public Standing fields alone", () => {
    const parsed = appCompetitionLeaderboardPageResponseSchema.parse(
      leaderboardPage({
        entries: [{ rank: 1, pseudo: "Player_42", seasonTotal: 412, owner: "private-account" }],
      }),
    );
    expect(parsed).toEqual(leaderboardPage());
  });

  it("accepts an empty Season and a page beyond the last page", () => {
    for (const page of [
      leaderboardPage({ pageCount: 0, entries: [] }),
      leaderboardPage({ page: 3, pageCount: 2, entries: [] }),
    ]) {
      expect(appCompetitionLeaderboardPageResponseSchema.parse(page)).toEqual(page);
    }
  });

  it("caps a page at the published size of 50", () => {
    expect(LEADERBOARD_PAGE_SIZE).toBe(50);
    const entry = { rank: 1, pseudo: "Player_42", seasonTotal: 412 };
    const entries = Array.from({ length: LEADERBOARD_PAGE_SIZE }, () => entry);
    expect(
      appCompetitionLeaderboardPageResponseSchema.safeParse(leaderboardPage({ entries })).success,
    ).toBe(true);
    expect(
      appCompetitionLeaderboardPageResponseSchema.safeParse(
        leaderboardPage({ entries: [...entries, entry] }),
      ).success,
    ).toBe(false);
  });

  it.each([
    { rank: -1 },
    { rank: 0 },
    { rank: 1.5 },
    { pseudo: "Éléonore" },
    { seasonTotal: -1 },
    { seasonTotal: 1.5 },
    { seasonTotal: 1551 },
  ])("rejects invalid entries: %j", (overrides) => {
    expect(
      appCompetitionLeaderboardPageResponseSchema.safeParse(
        leaderboardPage({
          entries: [{ rank: 1, pseudo: "Player_42", seasonTotal: 0, ...overrides }],
        }),
      ).success,
    ).toBe(false);
  });

  it.each([
    { season: "2026-9" },
    { season: "2026-00" },
    { season: "2026-09-01" },
    { page: 0 },
    { page: 1.5 },
    { pageCount: -1 },
    { pageCount: 1.5 },
  ])("rejects invalid pagination fields: %j", (overrides) => {
    expect(
      appCompetitionLeaderboardPageResponseSchema.safeParse(leaderboardPage(overrides)).success,
    ).toBe(false);
  });
});
