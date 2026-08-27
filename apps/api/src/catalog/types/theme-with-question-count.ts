import type { ThemeVisuals } from "./theme-visuals";

export type ThemeWithQuestionCount = ThemeVisuals & {
  id: string;
  name: string;
  questionCount: number;
};
