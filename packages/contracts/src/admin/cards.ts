import { z } from "zod";

export const cardTypeSchema = z.enum(["quiz", "true-false", "anecdote", "did-you-know", "riddle"]);
export type CardType = z.infer<typeof cardTypeSchema>;

export const socialSchema = z.enum(["x", "linkedin", "facebook", "tiktok", "youtube", "instagram"]);
export type Social = z.infer<typeof socialSchema>;

// Shared card columns are final per the cards migration; `payload` stays loose
// until the five per-Card-Type payload schemas land with the implementation
// issues (skeleton scope).
export const adminCardSchema = z.object({
  id: z.uuid(),
  type: cardTypeSchema,
  title: z.string(),
  tags: z.array(z.string()),
  postedOn: z.array(socialSchema),
  payload: z.unknown(),
  images: z.unknown(),
  createdAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
});
export type AdminCard = z.infer<typeof adminCardSchema>;

export const adminCardListQuerySchema = z.object({
  search: z.string().min(1).optional(),
  type: cardTypeSchema.optional(),
  tag: z.string().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
});
export type AdminCardListQuery = z.output<typeof adminCardListQuerySchema>;

// Only this route paginates: page/20, envelope fixed (#6).
export const adminCardListResponseSchema = z.object({
  items: z.array(adminCardSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.literal(20),
});
export type AdminCardListResponse = z.infer<typeof adminCardListResponseSchema>;
