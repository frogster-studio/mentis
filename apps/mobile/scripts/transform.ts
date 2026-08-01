// Pure transform from the source feed.json shape (Themes each owning their
// Questions) to the database row shapes upserted by the seed script.
// One Theme per Question is enforced by the feed's nesting. Question ids are
// globally unique across the whole feed: the same id appearing twice anywhere —
// including under two different Themes — is an authoring error, so reusing a
// Question elsewhere means a fresh id and a new entry (duplication over linking).
// When a Question omits its id, one is derived from its Theme and position.

export type FeedQuestion = {
  id?: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  aliases?: string[];
  misspellings?: string[];
};

export type FeedTheme = {
  id: string;
  name: string;
  questions: FeedQuestion[];
};

export type Feed = {
  themes: FeedTheme[];
};

export type ThemeRow = {
  id: string;
  name: string;
};

export type QuestionRow = {
  id: string;
  theme_id: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrong_choices: string[];
};

export type ContentRows = {
  themes: ThemeRow[];
  questions: QuestionRow[];
};

export function transformFeed(feed: Feed): ContentRows {
  const themes: ThemeRow[] = [];
  const questions: QuestionRow[] = [];
  const seenThemeIds = new Set<string>();
  const seenQuestionIds = new Set<string>();

  for (const theme of feed.themes) {
    if (!theme.id || !theme.name) {
      throw new Error(`Theme with empty id or name: "${theme.id}"`);
    }
    if (seenThemeIds.has(theme.id)) {
      throw new Error(`Duplicate theme id: "${theme.id}"`);
    }
    seenThemeIds.add(theme.id);
    themes.push({ id: theme.id, name: theme.name });

    theme.questions.forEach((feedQuestion, index) => {
      const row = toQuestionRow(feedQuestion, theme.id, index);
      if (seenQuestionIds.has(row.id)) {
        throw new Error(`Question id "${row.id}" appears twice in the feed`);
      }
      seenQuestionIds.add(row.id);
      questions.push(row);
    });
  }

  return { themes, questions };
}

function toQuestionRow(feedQuestion: FeedQuestion, themeId: string, index: number): QuestionRow {
  const { question, answers, correctAnswer, aliases, misspellings } = feedQuestion;
  const id = feedQuestion.id ?? `${themeId}-${String(index + 1).padStart(3, "0")}`;
  if (!id) {
    throw new Error("Question with empty id");
  }
  if (!question) {
    throw new Error(`Question "${id}" has empty text`);
  }
  if (answers.length !== 4 || answers.some((answer) => !answer)) {
    throw new Error(`Question "${id}" must have exactly 4 non-empty answers`);
  }
  if (!Number.isInteger(correctAnswer) || correctAnswer < 0 || correctAnswer > 3) {
    throw new Error(`Question "${id}" has an out-of-range correctAnswer index`);
  }
  return {
    id,
    theme_id: themeId,
    text: question,
    answer: answers[correctAnswer],
    aliases: aliases ? [...aliases] : [],
    misspellings: misspellings ? [...misspellings] : [],
    wrong_choices: answers.filter((_, i) => i !== correctAnswer),
  };
}
