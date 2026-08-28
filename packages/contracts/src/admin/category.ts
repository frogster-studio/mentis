import { z } from "zod";

export const adminCategoryIdSchema = z.guid();

export const adminCategoryResponseSchema = z.object({
  id: z.guid(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});
export type AdminCategoryResponse = z.infer<typeof adminCategoryResponseSchema>;

export const adminCategoryListResponseSchema = z.array(adminCategoryResponseSchema);
export type AdminCategoryListResponse = z.infer<typeof adminCategoryListResponseSchema>;

// The slug is absent by design: it is born from the name at creation and never authored.
export const adminCategoryWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  // The app paints the stored value raw, so curation only ever writes the lowercase hex it expects.
  color: z.string().regex(/^#[0-9a-f]{6}$/, "A color is a lowercase #rrggbb"),
  icon: z.string().trim().min(1).max(255),
});
export type AdminCategoryWrite = z.infer<typeof adminCategoryWriteSchema>;
