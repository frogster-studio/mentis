import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import { POINTS_CASH, POINTS_SQUARE } from "@/features/quiz/constants";
import { isOnboardingOutcome, onboardingOutcome, outcomePoints } from "./outcome";

describe("onboardingOutcome", () => {
  it("reads a quit as missed", () => {
    expect(onboardingOutcome(null)).toBe("missed");
  });

  it("reads an expired Countdown with nothing typed as missed", () => {
    expect(
      onboardingOutcome({ input: "  ", correct: false, points: 0, mode: QuizAnswerModeEnum.CASH }),
    ).toBe("missed");
  });

  it("reads a judged wrong answer as wrong in either mode", () => {
    expect(
      onboardingOutcome({
        input: "Le Vésuve",
        correct: false,
        points: 0,
        mode: QuizAnswerModeEnum.SQUARE,
      }),
    ).toBe("wrong");
    expect(
      onboardingOutcome({
        input: "vesuve",
        correct: false,
        points: 0,
        mode: QuizAnswerModeEnum.CASH,
      }),
    ).toBe("wrong");
  });

  it("tells a Cash hit from a Carré hit", () => {
    expect(
      onboardingOutcome({
        input: "Ojos del Salado",
        correct: true,
        points: POINTS_CASH,
        mode: QuizAnswerModeEnum.CASH,
      }),
    ).toBe("cash");
    expect(
      onboardingOutcome({
        input: "L'Ojos del Salado",
        correct: true,
        points: POINTS_SQUARE,
        mode: QuizAnswerModeEnum.SQUARE,
      }),
    ).toBe("square");
  });
});

describe("outcomePoints", () => {
  it("scores like a practice answer", () => {
    expect(outcomePoints("cash")).toBe(POINTS_CASH);
    expect(outcomePoints("square")).toBe(POINTS_SQUARE);
    expect(outcomePoints("wrong")).toBe(0);
    expect(outcomePoints("missed")).toBe(0);
  });
});

describe("isOnboardingOutcome", () => {
  it("accepts only the four outcomes a route param may carry", () => {
    expect(isOnboardingOutcome("cash")).toBe(true);
    expect(isOnboardingOutcome("bravo")).toBe(false);
    expect(isOnboardingOutcome(undefined)).toBe(false);
  });
});
