import { z } from "zod";

export const appAnecdoteDrawQuerySchema = z.object({
  n: z.coerce.number().int().min(1).max(50).default(3),
});
export type AppAnecdoteDrawQuery = z.infer<typeof appAnecdoteDrawQuerySchema>;

const appAnecdoteSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export const appAnecdoteDrawResponseSchema = z.array(appAnecdoteSchema);
export type AppAnecdoteDrawResponse = z.infer<typeof appAnecdoteDrawResponseSchema>;
