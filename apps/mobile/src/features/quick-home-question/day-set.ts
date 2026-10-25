import { quickHomeQuestionChoices } from "@mentis/answer-matching";
import { parisDay } from "@/features/account/streak";
import type { Question } from "@/types/quiz";
import { quickHomeQuestionEndMessage } from "./constants";

export type QuickHomeQuestionTile = {
  question: Question;
  // Drawn once with the set, so reopening the app never reshuffles.
  choices: [string, string];
};

export type QuickHomeQuestionDaySet = {
  day: string;
  tiles: QuickHomeQuestionTile[];
  // Tiles are answered in order, so the nth result belongs to the nth tile.
  results: boolean[];
};

export function buildDaySet(
  questions: Question[],
  now: Date,
  rng: () => number,
): QuickHomeQuestionDaySet {
  return {
    day: parisDay(now),
    tiles: questions.map((question) => ({
      question,
      choices: quickHomeQuestionChoices(question, rng),
    })),
    results: [],
  };
}

// A past day's set is dropped even half-answered; today's, even empty or done, is kept.
export function isDrawDue(daySet: QuickHomeQuestionDaySet | null, now: Date): boolean {
  return daySet?.day !== parisDay(now);
}

export function topTile(daySet: QuickHomeQuestionDaySet): QuickHomeQuestionTile | null {
  return daySet.tiles[daySet.results.length] ?? null;
}

export function answerTopTile(
  daySet: QuickHomeQuestionDaySet,
  choice: string,
): QuickHomeQuestionDaySet {
  const tile = topTile(daySet);
  if (tile === null) {
    return daySet;
  }
  return { ...daySet, results: [...daySet.results, choice === tile.question.answer] };
}

export function daySetEndMessage(daySet: QuickHomeQuestionDaySet): string | null {
  return quickHomeQuestionEndMessage(
    daySet.results.filter((correct) => correct).length,
    daySet.tiles.length,
  );
}
