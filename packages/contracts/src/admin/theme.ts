import { z } from "zod";

const adminThemeSchema = z.object({
  id: z.guid(),
  name: z.string(),
  categoryId: z.guid(),
  // The stored bucket path, not the composed URL: curation edits the path the app reads through.
  image: z.string(),
  published: z.boolean(),
  questionCount: z.number().int().nonnegative(),
  readyQuestionCount: z.number().int().nonnegative(),
});

export const adminThemeListResponseSchema = z.array(adminThemeSchema);
export type AdminThemeListResponse = z.infer<typeof adminThemeListResponseSchema>;
