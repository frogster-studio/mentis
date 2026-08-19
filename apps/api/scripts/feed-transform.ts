// The DB constraints are checked here, so a malformed feed fails before any write.

export type FeedQuestion = {
  id: string;
  question: string;
  answers: string[];
  correctAnswer: number;
  aliases?: string[];
  misspellings?: string[];
};

export type Feed = {
  id: string;
  name: string;
  questions: FeedQuestion[];
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

export function transformFeeds(feeds: Feed[]): ContentRows {
  const themes: ThemeRow[] = [];
  const questions: QuestionRow[] = [];
  const seenThemeIds = new Set<string>();
  const seenQuestionIds = new Set<string>();

  for (const feed of feeds) {
    if (!feed.id || !feed.name) {
      throw new Error(`Theme with empty id or name: "${feed.id}"`);
    }
    if (seenThemeIds.has(feed.id)) {
      throw new Error(`Duplicate theme id: "${feed.id}"`);
    }
    seenThemeIds.add(feed.id);
    themes.push({ id: feed.id, name: feed.name });

    for (const feedQuestion of feed.questions) {
      const row = toQuestionRow(feedQuestion, feed.id);
      // A Question reused under another Theme is a fresh entry, never a shared id.
      if (seenQuestionIds.has(row.id)) {
        throw new Error(`Question id "${row.id}" appears twice across the feeds`);
      }
      seenQuestionIds.add(row.id);
      questions.push(row);
    }
  }

  return { themes, questions };
}

function toQuestionRow(feedQuestion: FeedQuestion, themeId: string): QuestionRow {
  const { id, question, answers, correctAnswer, aliases, misspellings } = feedQuestion;
  if (!id) {
    throw new Error(`Question without id under theme "${themeId}"`);
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
    wrong_choices: answers.filter((_, index) => index !== correctAnswer),
  };
}
