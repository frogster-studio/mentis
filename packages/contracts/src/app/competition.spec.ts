import { describe, expect, it } from "vitest";
import { appCompetitionAttemptResponseSchema, COMPETITION_QUESTION_COUNT } from "./competition";

const question = (index: number, overrides: Record<string, unknown> = {}) => ({
  id: `q${index}`,
  text: `Question ${index} ?`,
  squareChoices: ["Paris", "Lyon", "Nice", "Brest"],
  ...overrides,
});

const attempt = (overrides: Record<string, unknown> = {}) => ({
  id: "3f2b1c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  day: "2026-08-20",
  kind: "initial",
  status: "active",
  themeId: "geo",
  themeName: "Géographie",
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

  it("rejects a Competition Day that is not a plain Europe/Paris date", () => {
    expect(
      appCompetitionAttemptResponseSchema.safeParse(attempt({ day: "2026-08-20T00:00:00.000Z" }))
        .success,
    ).toBe(false);
  });
});
