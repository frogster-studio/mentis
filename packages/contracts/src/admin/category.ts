import { z } from "zod";

const adminCategorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  color: z.string(),
  icon: z.string(),
});

export const adminCategoryListResponseSchema = z.array(adminCategorySchema);
export type AdminCategoryListResponse = z.infer<typeof adminCategoryListResponseSchema>;
