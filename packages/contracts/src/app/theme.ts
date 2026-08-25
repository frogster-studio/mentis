import { z } from "zod";

export const appCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().regex(/^#[0-9a-f]{6}$/),
  icon: z.string().min(1),
});

const appThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.url(),
  questionCount: z.number().int().nonnegative(),
  category: appCategorySchema,
});

export const appThemeListResponseSchema = z.array(appThemeSchema);
export type AppThemeListResponse = z.infer<typeof appThemeListResponseSchema>;
