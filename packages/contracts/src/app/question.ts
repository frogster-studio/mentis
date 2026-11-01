import { z } from "zod";

export const appQuestionDrawQuerySchema = z.object({
  theme: z.string().min(1).optional(),
  n: z.coerce.number().int().min(1).max(50).default(10),
});
export type AppQuestionDrawQuery = z.infer<typeof appQuestionDrawQuerySchema>;

const appQuestionSchema = z.object({
  id: z.string(),
  themeId: z.string(),
  themeName: z.string(),
  text: z.string(),
  answer: z.string(),
  aliases: z.array(z.string()),
  misspellings: z.array(z.string()),
  wrongChoices: z.array(z.string()),
});

export const appQuestionDrawResponseSchema = z.array(appQuestionSchema);
export type AppQuestionDrawResponse = z.infer<typeof appQuestionDrawResponseSchema>;
