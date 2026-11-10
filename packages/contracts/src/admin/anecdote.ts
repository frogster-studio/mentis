import { z } from "zod";

// The ** and __ emphasis markers count in the limit, as they do in the stored column.
const ANECDOTE_MAX_LENGTH = 140;

export const adminAnecdoteWriteSchema = z.object({
  text: z.string().trim().min(1).max(ANECDOTE_MAX_LENGTH),
});
export type AdminAnecdoteWrite = z.infer<typeof adminAnecdoteWriteSchema>;

export const adminAnecdoteResponseSchema = z.object({
  id: z.guid(),
  text: z.string(),
});
export type AdminAnecdoteResponse = z.infer<typeof adminAnecdoteResponseSchema>;
