export type ShuffleableQuestion = {
  answer: string;
  wrongChoices: string[];
};

// rng is in [0, 1) like Math.random; uniform Fisher–Yates, matching the Draw's idiom.
export function squareChoices(question: ShuffleableQuestion, rng: () => number): string[] {
  const choices = [question.answer, ...question.wrongChoices];
  for (let i = 0; i < choices.length - 1; i += 1) {
    const j = i + Math.floor(rng() * (choices.length - i));
    [choices[i], choices[j]] = [choices[j], choices[i]];
  }
  return choices;
}
