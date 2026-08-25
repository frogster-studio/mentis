import { describe, expect, it } from "vitest";
import { QuizAnswerModeEnum, UserAnswerMatchedViaEnum } from "../enums";
import {
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionFinalizeInputSchema,
  appCompetitionStandingResponseSchema,
  appCompetitionTranscriptResponseSchema,
  COMPETITION_POINTS,
  COMPETITION_QUESTION_COUNT,
} from "./competition";

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

describe("appCompetitionStandingResponseSchema", () => {
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
    expect(appCompetitionStandingResponseSchema.parse(standing())).toEqual(standing());
  });

  it("carries an empty season — the Player has played no Attempt this month", () => {
    const parsed = appCompetitionStandingResponseSchema.parse(
      standing({ seasonTotal: 0, days: [] }),
    );
    expect(parsed.days).toEqual([]);
  });

  it("rejects a day above the ten-Cash ceiling", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(
        standing({ days: [{ day: "2026-08-20", score: 51 }] }),
      ).success,
    ).toBe(false);
  });

  it("rejects a season that is not a plain Europe/Paris month", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(standing({ season: "2026-8" })).success,
    ).toBe(false);
    expect(
      appCompetitionStandingResponseSchema.safeParse(standing({ season: "2026-08-20" })).success,
    ).toBe(false);
  });

  it("rejects a month no calendar holds", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(standing({ season: "2026-00" })).success,
    ).toBe(false);
    expect(
      appCompetitionStandingResponseSchema.safeParse(standing({ season: "2026-13" })).success,
    ).toBe(false);
    expect(appCompetitionStandingResponseSchema.parse(standing({ season: "2026-12" })).season).toBe(
      "2026-12",
    );
  });

  it("rejects a total above what a month of Attempts can hold", () => {
    expect(
      appCompetitionStandingResponseSchema.safeParse(standing({ seasonTotal: 1551 })).success,
    ).toBe(false);
  });
});
