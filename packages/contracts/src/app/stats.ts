import { z } from "zod";

// Wire shapes for GET /app/me/stats (#6). `owner` never appears on the wire —
// it comes from the verified JWT. Columns mirror the player tables migration.
export const appStatBaselineSchema = z.object({
  device: z.uuid(),
  themeId: z.string(),
  themeName: z.string(),
  totalPoints: z.number().int(),
  sessionCount: z.number().int(),
});
export type AppStatBaseline = z.infer<typeof appStatBaselineSchema>;

export const appQuizSessionSchema = z.object({
  id: z.uuid(),
  themeId: z.string(),
  themeName: z.string(),
  points: z.number().int(),
  finishedAt: z.iso.datetime({ offset: true }),
});
export type AppQuizSession = z.infer<typeof appQuizSessionSchema>;

export const appAccountStatsResponseSchema = z.object({
  baselines: z.array(appStatBaselineSchema),
  sessions: z.array(appQuizSessionSchema),
});
export type AppAccountStatsResponse = z.infer<typeof appAccountStatsResponseSchema>;
