import { z } from "zod";

const appThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  questionCount: z.number().int().nonnegative(),
});

export const appThemeListResponseSchema = z.array(appThemeSchema);
export type AppThemeListResponse = z.infer<typeof appThemeListResponseSchema>;
