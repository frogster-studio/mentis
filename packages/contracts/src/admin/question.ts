import { z } from "zod";

export const adminQuestionListQuerySchema = z.object({ themeId: z.guid() });
export type AdminQuestionListQuery = z.infer<typeof adminQuestionListQuerySchema>;

const adminQuestionSchema = z.object({
  id: z.guid(),
  themeId: z.guid(),
  text: z.string(),
  answer: z.string(),
  aliases: z.array(z.string()),
  misspellings: z.array(z.string()),
  wrongChoices: z.array(z.string()),
  readyToBePublished: z.boolean(),
});

export const adminQuestionListResponseSchema = z.array(adminQuestionSchema);
export type AdminQuestionListResponse = z.infer<typeof adminQuestionListResponseSchema>;
