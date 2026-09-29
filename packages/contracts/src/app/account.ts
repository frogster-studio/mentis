import { z } from "zod";

// Mobile chunks every push queue to this size, so a full chunk is never over the cap.
export const MAX_PUSH_BATCH = 200;

const statBaselineSchema = z.object({
  themeId: z.string().min(1),
  themeName: z.string().min(1),
  totalPoints: z.number().int().nonnegative(),
  sessionCount: z.number().int().nonnegative(),
});

const quizSessionSchema = z.object({
  id: z.uuid(),
  themeId: z.string().min(1),
  themeName: z.string().min(1),
  points: z.number().int().nonnegative(),
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
  baselines: z.array(statBaselineSchema),
  sessions: z.array(quizSessionSchema),
  practiceStreak: streakSchema,
  competitionStreak: streakSchema,
});
export type AppAccountStatsResponse = z.infer<typeof appAccountStatsResponseSchema>;

// finishedAt orders the shelf server-side, so it goes in and never comes back.
export const appQuizSessionPushInputSchema = z
  .array(quizSessionSchema.extend({ finishedAt: z.iso.datetime({ offset: true }) }))
  .max(MAX_PUSH_BATCH);
export type AppQuizSessionPushInput = z.infer<typeof appQuizSessionPushInputSchema>;

export const appStatBaselinePushInputSchema = z
  .array(statBaselineSchema.extend({ device: z.uuid() }))
  .max(MAX_PUSH_BATCH);
export type AppStatBaselinePushInput = z.infer<typeof appStatBaselinePushInputSchema>;

export const appPracticeDayPushInputSchema = z
  .array(z.object({ device: z.uuid(), day: z.iso.date() }))
  .max(MAX_PUSH_BATCH);
export type AppPracticeDayPushInput = z.infer<typeof appPracticeDayPushInputSchema>;
