import { z } from "zod";
import { MAX_SCORE } from "./competition";
import { appCategorySchema } from "./theme";

// Mobile chunks every push queue to this size, so a full chunk is never over the cap.
export const MAX_PUSH_BATCH = 200;

const countSchema = z.number().int().nonnegative();
const bestScoreSchema = z.number().int().min(0).max(MAX_SCORE).nullable();

const themeTallySchema = z
  .object({
    themeId: z.string().min(1),
    themeName: z.string().min(1),
    // Null for a Theme the Editor deleted.
    category: appCategorySchema.nullable(),
    practice: z.object({
      sessionCount: countSchema,
      totalPoints: countSchema,
      bestScore: bestScoreSchema,
    }),
    competition: z
      .object({
        attemptCount: countSchema,
        judgedCount: countSchema,
        totalPoints: countSchema,
        bestScore: bestScoreSchema,
      })
      .refine((competition) => competition.judgedCount <= competition.attemptCount, {
        message: "judgedCount is never above attemptCount",
        path: ["judgedCount"],
      }),
  })
  .refine((tally) => tally.practice.sessionCount + tally.competition.attemptCount > 0, {
    message: "a tally holds at least one game",
  });

// length runs back from lastDay; whether it is still current is the phone's call, on its own clock.
const streakSchema = z
  .object({
    lastDay: z.iso.date().nullable(),
    length: z.number().int().nonnegative(),
    longest: z.number().int().nonnegative(),
  })
  .refine((streak) => streak.longest >= streak.length, {
    message: "longest is never below length",
    path: ["longest"],
  });
export type AppStreak = z.infer<typeof streakSchema>;

export const appAccountStatsResponseSchema = z.object({
  themes: z.array(themeTallySchema),
  practiceStreak: streakSchema,
  competitionStreak: streakSchema,
});
export type AppAccountStatsResponse = z.infer<typeof appAccountStatsResponseSchema>;

export const appQuizSessionPushInputSchema = z
  .array(
    z.object({
      id: z.uuid(),
      themeId: z.string().min(1),
      themeName: z.string().min(1),
      points: countSchema,
      finishedAt: z.iso.datetime({ offset: true }),
    }),
  )
  .max(MAX_PUSH_BATCH);
export type AppQuizSessionPushInput = z.infer<typeof appQuizSessionPushInputSchema>;

export const appStatBaselinePushInputSchema = z
  .array(
    z.object({
      device: z.uuid(),
      themeId: z.string().min(1),
      themeName: z.string().min(1),
      totalPoints: countSchema,
      sessionCount: countSchema,
      bestScore: bestScoreSchema,
    }),
  )
  .max(MAX_PUSH_BATCH);
export type AppStatBaselinePushInput = z.infer<typeof appStatBaselinePushInputSchema>;

export const appPracticeDayPushInputSchema = z
  .array(z.object({ device: z.uuid(), day: z.iso.date() }))
  .max(MAX_PUSH_BATCH);
export type AppPracticeDayPushInput = z.infer<typeof appPracticeDayPushInputSchema>;
