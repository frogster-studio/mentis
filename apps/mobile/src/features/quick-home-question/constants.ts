export const QUICK_HOME_QUESTION_TAG = "Questions du jour";
export const QUICK_HOME_QUESTION_COUNT = 3;
export const QUICK_HOME_QUESTION_REVEAL_MS = 250;
export const QUICK_HOME_QUESTION_HOLD_MS = 700;
export const QUICK_HOME_QUESTION_FADE_MS = 200;

export function quickHomeQuestionCounterTag(answeredCount: number, total: number): string {
  return `${QUICK_HOME_QUESTION_TAG} : ${answeredCount} sur ${total}`;
}

// A set with nothing right ends in silence, never a consolation.
export function quickHomeQuestionEndMessage(correctCount: number, total: number): string | null {
  if (correctCount === 0) {
    return null;
  }
  const score =
    correctCount === 1
      ? `1 question juste sur ${total}`
      : `${correctCount} questions justes sur ${total}`;
  return correctCount === total ? `${score}, bravo !` : `${score}, bien joué !`;
}
