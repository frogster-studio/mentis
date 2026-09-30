import { z } from "zod";
import { SessionTypeEnum } from "../enums";
import { appCategorySchema } from "./theme";

export const HISTORY_PAGE_SIZE = 20;

const playedAtSchema = z.iso.datetime({ offset: true });

// Every line strictly before the cursor; no cursor reads the newest page.
export const appHistoryQuerySchema = z.object({
  before: playedAtSchema.optional(),
});
export type AppHistoryQuery = z.infer<typeof appHistoryQuerySchema>;

const historySessionSchema = z.object({
  id: z.uuid(),
  type: z.enum(SessionTypeEnum),
  themeId: z.string().min(1),
  // Captured when played, never the current catalog name.
  themeName: z.string().min(1),
  // Null for a Theme the Editor deleted.
  category: appCategorySchema.nullable(),
  // No /50 cap: questionCount is the score's scale.
  score: z.number().int().min(0),
  questionCount: z.number().int().min(1),
  durationMs: z.number().int().min(0).nullable(),
  playedAt: playedAtSchema,
});
export type AppHistorySession = z.infer<typeof historySessionSchema>;

export const appHistoryPageResponseSchema = z.object({
  sessions: z.array(historySessionSchema).max(HISTORY_PAGE_SIZE),
  nextBefore: playedAtSchema.nullable(),
});
export type AppHistoryPageResponse = z.infer<typeof appHistoryPageResponseSchema>;
