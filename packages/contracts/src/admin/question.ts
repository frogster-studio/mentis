import { z } from "zod";

export const adminQuestionListQuerySchema = z.object({ themeId: z.guid() });
export type AdminQuestionListQuery = z.infer<typeof adminQuestionListQuerySchema>;

export const adminQuestionIdSchema = z.guid();

export const adminQuestionResponseSchema = z.object({
  id: z.guid(),
  themeId: z.guid(),
  text: z.string(),
  answer: z.string(),
  aliases: z.array(z.string()),
  misspellings: z.array(z.string()),
  wrongChoices: z.array(z.string()),
  readyToBePublished: z.boolean(),
});
export type AdminQuestionResponse = z.infer<typeof adminQuestionResponseSchema>;

export const adminQuestionListResponseSchema = z.array(adminQuestionResponseSchema);
export type AdminQuestionListResponse = z.infer<typeof adminQuestionListResponseSchema>;

const authoredAnswer = z.string().trim().min(1).max(255);

// Answer Matching only ever sees lowercase variants, so the contract normalizes whatever was typed.
const authoredVariants = z
  .array(z.string().trim().toLowerCase().max(255))
  .transform((variants) => [...new Set(variants.filter((variant) => variant !== ""))]);

// A Question is complete or refused: text, the designated correct answer, and three distinct wrong choices.
export const adminQuestionWriteSchema = z
  .object({
    themeId: z.guid(),
    text: z.string().trim().min(1),
    answer: authoredAnswer,
    wrongChoices: z.array(authoredAnswer).length(3),
    aliases: authoredVariants,
    misspellings: authoredVariants,
  })
  .refine(
    ({ answer, wrongChoices }) =>
      new Set([answer, ...wrongChoices].map((slot) => slot.toLowerCase())).size === 4,
    // The Carré shuffle draws the four slots as choices, so a repeat would offer two correct ones.
    { message: "The four answers must all differ", path: ["wrongChoices"] },
  );
export type AdminQuestionWrite = z.infer<typeof adminQuestionWriteSchema>;
