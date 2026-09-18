import { QuizAnswerModeEnum } from "@mentis/contracts/enums";
import { POINTS_CASH, POINTS_SQUARE } from "@/features/quiz/constants";
import type { SessionAnswer } from "@/features/quiz/session-reducer";

export const ONBOARDING_OUTCOMES = ["cash", "square", "wrong", "missed"] as const;

export type OnboardingOutcome = (typeof ONBOARDING_OUTCOMES)[number];

export function isOnboardingOutcome(value: unknown): value is OnboardingOutcome {
  return ONBOARDING_OUTCOMES.some((outcome) => outcome === value);
}

// A quit or an untouched Countdown both leave no answer, so both read as « missed ».
export function onboardingOutcome(answer: SessionAnswer | null): OnboardingOutcome {
  if (answer === null || answer.input.trim() === "") {
    return "missed";
  }
  if (!answer.correct) {
    return "wrong";
  }
  return answer.mode === QuizAnswerModeEnum.SQUARE ? "square" : "cash";
}

export function outcomePoints(outcome: OnboardingOutcome): number {
  return outcome === "cash" ? POINTS_CASH : outcome === "square" ? POINTS_SQUARE : 0;
}
