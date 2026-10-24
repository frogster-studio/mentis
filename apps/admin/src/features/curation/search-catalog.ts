import { findQueryWords, readQueryWords, type WordFind } from "./search-words";
import type { Category, Question, Theme } from "./types";

export type Highlight = { start: number; end: number };

export type NameResult<Item> = { item: Item; nameHighlights: Highlight[] };

export type FoundWrongChoice = { wrongChoice: string; highlights: Highlight[] };

export type QuestionResult = {
  item: Question;
  textHighlights: Highlight[];
  answerHighlights: Highlight[];
  foundWrongChoices: FoundWrongChoice[];
};

export type ResultGroup<Result> = { total: number; results: Result[] };

export type CatalogSearch = {
  categories: ResultGroup<NameResult<Category>>;
  themes: ResultGroup<NameResult<Theme>>;
  questions: ResultGroup<QuestionResult>;
};

export const SEARCH_CAPS = { categories: 3, themes: 5, questions: 8 } as const;

// A Question found in its Canonical Answer outranks one found in its text, itself above its wrong choices.
const QUESTION_FIELD_RANK = { answer: 0, text: 1, wrongChoice: 2 } as const;

type Candidate<Result> = {
  result: Result;
  wholeQueryWords: number;
  fieldRank: number;
  label: string;
};

// One field's finds, one list per query word.
type FieldFinds = WordFind[][];

function holdsAFind(fieldFinds: FieldFinds): boolean {
  return fieldFinds.some((wordFinds) => wordFinds.length > 0);
}

function findsEveryQueryWord(queryWords: string[], fieldsFinds: FieldFinds[]): boolean {
  return queryWords.every((_, index) => fieldsFinds.some((finds) => finds[index].length > 0));
}

function countWholeQueryWords(queryWords: string[], fieldsFinds: FieldFinds[]): number {
  return queryWords.filter((_, index) =>
    fieldsFinds.some((finds) => finds[index].some(({ whole }) => whole)),
  ).length;
}

function highlights(fieldFinds: FieldFinds): Highlight[] {
  const byStart = new Map<number, Highlight>();
  for (const { start, end } of fieldFinds.flat()) byStart.set(start, { start, end });
  return [...byStart.values()].sort((left, right) => left.start - right.start);
}

function byRank<Result>(left: Candidate<Result>, right: Candidate<Result>): number {
  return (
    right.wholeQueryWords - left.wholeQueryWords ||
    left.fieldRank - right.fieldRank ||
    left.label.length - right.label.length ||
    left.label.localeCompare(right.label, "fr")
  );
}

function rankGroup<Result>(candidates: Candidate<Result>[], cap: number): ResultGroup<Result> {
  return {
    total: candidates.length,
    results: candidates
      .sort(byRank)
      .slice(0, cap)
      .map(({ result }) => result),
  };
}

function searchNames<Item extends { name: string }>(
  queryWords: string[],
  items: Item[],
  cap: number,
): ResultGroup<NameResult<Item>> {
  const candidates = items.flatMap((item) => {
    const nameFinds = findQueryWords(queryWords, item.name);
    if (!findsEveryQueryWord(queryWords, [nameFinds])) return [];
    return [
      {
        result: { item, nameHighlights: highlights(nameFinds) },
        wholeQueryWords: countWholeQueryWords(queryWords, [nameFinds]),
        fieldRank: 0,
        label: item.name,
      },
    ];
  });
  return rankGroup(candidates, cap);
}

// A Question is one bag of words, so each query word may land in its text or any of its four answers.
function searchQuestions(
  queryWords: string[],
  questions: Question[],
  cap: number,
): ResultGroup<QuestionResult> {
  const candidates = questions.flatMap((question) => {
    const answerFinds = findQueryWords(queryWords, question.answer);
    const textFinds = findQueryWords(queryWords, question.text);
    const wrongChoicesFinds = question.wrongChoices.map((wrongChoice) =>
      findQueryWords(queryWords, wrongChoice),
    );
    const fieldsFinds = [answerFinds, textFinds, ...wrongChoicesFinds];
    if (!findsEveryQueryWord(queryWords, fieldsFinds)) return [];
    return [
      {
        result: {
          item: question,
          textHighlights: highlights(textFinds),
          answerHighlights: highlights(answerFinds),
          foundWrongChoices: question.wrongChoices.flatMap((wrongChoice, index) =>
            holdsAFind(wrongChoicesFinds[index])
              ? [{ wrongChoice, highlights: highlights(wrongChoicesFinds[index]) }]
              : [],
          ),
        },
        wholeQueryWords: countWholeQueryWords(queryWords, fieldsFinds),
        fieldRank: holdsAFind(answerFinds)
          ? QUESTION_FIELD_RANK.answer
          : holdsAFind(textFinds)
            ? QUESTION_FIELD_RANK.text
            : QUESTION_FIELD_RANK.wrongChoice,
        label: question.text,
      },
    ];
  });
  return rankGroup(candidates, cap);
}

// A query holding no word searches nothing, so the caller keeps its list closed on null.
export function searchCatalog(
  query: string,
  catalog: { categories: Category[]; themes: Theme[]; questions: Question[] },
): CatalogSearch | null {
  const queryWords = readQueryWords(query);
  if (queryWords.length === 0) return null;
  return {
    categories: searchNames(queryWords, catalog.categories, SEARCH_CAPS.categories),
    themes: searchNames(queryWords, catalog.themes, SEARCH_CAPS.themes),
    questions: searchQuestions(queryWords, catalog.questions, SEARCH_CAPS.questions),
  };
}
