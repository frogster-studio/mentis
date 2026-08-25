import { z } from "zod";
import { QuizAnswerModeEnum, UserAnswerMatchedViaEnum } from "../enums";

export const COMPETITION_QUESTION_COUNT = 10;
// The self-reported mode alone prices a correct answer.
export const COMPETITION_POINTS = { cash: 5, square: 2 } as const;

const MAX_SCORE = COMPETITION_QUESTION_COUNT * COMPETITION_POINTS.cash;
const MAX_SEASON_SCORE = MAX_SCORE * 31;

const competitionAttemptKindSchema = z.enum(["initial", "replay", "catchup"]);

const competitionQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  squareChoices: z.array(z.string()).length(4),
});

export const appCompetitionAttemptResponseSchema = z.object({
  id: z.uuid(),
  day: z.iso.date(),
  kind: competitionAttemptKindSchema,
  status: z.enum(["active", "finalized"]),
  themeId: z.string(),
  themeName: z.string(),
  // Served order — a finalize batch answers by position into this list.
  questions: z.array(competitionQuestionSchema).length(COMPETITION_QUESTION_COUNT),
});
export type AppCompetitionAttemptResponse = z.infer<typeof appCompetitionAttemptResponseSchema>;

// No active Attempt is an ordinary answer: the phone asks on every launch, crash or not.
export const appCompetitionActiveAttemptResponseSchema = z.object({
  attempt: appCompetitionAttemptResponseSchema.nullable(),
});
export type AppCompetitionActiveAttemptResponse = z.infer<
  typeof appCompetitionActiveAttemptResponseSchema
>;

const competitionAnswerInputSchema = z.object({
  questionId: z.string(),
  mode: z.enum(QuizAnswerModeEnum).exclude([QuizAnswerModeEnum.NONE]),
  rawInput: z.string(),
  clientElapsedMs: z.number().int().min(0),
});

export const appCompetitionAttemptIdSchema = z.uuid();

// The served prefix, index for position: the phone resolves in order, so a short batch is a quit.
export const appCompetitionFinalizeInputSchema = z.object({
  answers: z.array(competitionAnswerInputSchema).max(COMPETITION_QUESTION_COUNT),
});
export type AppCompetitionFinalizeInput = z.infer<typeof appCompetitionFinalizeInputSchema>;

const competitionVerdictSchema = z.object({
  position: z
    .number()
    .int()
    .min(0)
    .max(COMPETITION_QUESTION_COUNT - 1),
  questionId: z.string(),
  questionText: z.string(),
  // Revealed here and nowhere earlier: the results screen ends the Attempt that hid it.
  canonicalAnswer: z.string(),
  mode: z.enum(QuizAnswerModeEnum),
  rawInput: z.string().nullable(),
  correct: z.boolean(),
  points: z.number().int().min(0).max(COMPETITION_POINTS.cash),
  matchedVia: z.enum(UserAnswerMatchedViaEnum).nullable(),
});

export const appCompetitionTranscriptResponseSchema = z.object({
  id: z.uuid(),
  day: z.iso.date(),
  kind: competitionAttemptKindSchema,
  themeId: z.string(),
  themeName: z.string(),
  finalizeReason: z.enum(["completed", "quit", "expired"]),
  score: z.number().int().min(0).max(MAX_SCORE),
  answers: z.array(competitionVerdictSchema).length(COMPETITION_QUESTION_COUNT),
});
export type AppCompetitionTranscriptResponse = z.infer<
  typeof appCompetitionTranscriptResponseSchema
>;

// A season is the Europe/Paris calendar month an Attempt's Competition Day falls in.
const competitionSeasonSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export const appCompetitionStandingResponseSchema = z.object({
  season: competitionSeasonSchema,
  seasonTotal: z.number().int().min(0).max(MAX_SEASON_SCORE),
  days: z.array(z.object({ day: z.iso.date(), score: z.number().int().min(0).max(MAX_SCORE) })),
});
export type AppCompetitionStandingResponse = z.infer<typeof appCompetitionStandingResponseSchema>;
