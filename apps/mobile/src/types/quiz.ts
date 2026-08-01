// Canonical domain types (see CONTEXT.md for the glossary).

export type QuizMode = "cash" | "square";

export type Theme = {
  id: string;
  name: string;
};

export type ThemeWithCount = Theme & {
  questionCount: number;
};

export type Question = {
  id: string;
  text: string;
  answer: string;
  aliases: string[];
  misspellings: string[];
  wrongChoices: string[];
};
