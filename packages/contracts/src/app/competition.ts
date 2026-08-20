import { z } from "zod";

export const COMPETITION_QUESTION_COUNT = 10;

const competitionQuestionSchema = z.object({
  id: z.string(),
  text: z.string(),
  squareChoices: z.array(z.string()).length(4),
});

export const appCompetitionAttemptResponseSchema = z.object({
  id: z.uuid(),
  day: z.iso.date(),
  kind: z.enum(["initial", "replay", "catchup"]),
  status: z.enum(["active", "finalized"]),
  themeId: z.string(),
  themeName: z.string(),
  // Served order — a finalize batch answers by position into this list.
  questions: z.array(competitionQuestionSchema).length(COMPETITION_QUESTION_COUNT),
});
export type AppCompetitionAttemptResponse = z.infer<typeof appCompetitionAttemptResponseSchema>;
