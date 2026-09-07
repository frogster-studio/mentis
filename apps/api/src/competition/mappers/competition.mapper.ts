import { squareChoices } from "@mentis/answer-matching";
import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionDayResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionDayResponseSchema,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";
import type { ServedAttempt } from "../types/served-attempt";
import { seededRng } from "../utils/seeded-rng";

const themePayload = ({ attempt, theme }: ServedAttempt) => ({
  themeId: attempt.themeId,
  themeName: attempt.themeName,
  imageUrl: theme.imageUrl,
  category: theme.category,
});

const servedPayload = (served: ServedAttempt) => ({
  id: served.attempt.id,
  day: served.attempt.day,
  kind: served.attempt.kind,
  status: served.attempt.status,
  ...themePayload(served),
  questions: served.questions.map((question) => ({
    id: question.id,
    text: question.text,
    squareChoices: squareChoices(question, seededRng(`${served.attempt.id}:${question.id}`)),
  })),
});

// Parsing through the contract is what keeps the answer material off the wire.
export const toAppCompetitionAttemptResponse = (
  served: ServedAttempt,
): AppCompetitionAttemptResponse =>
  appCompetitionAttemptResponseSchema.parse(servedPayload(served));

// The same payload the issuance served, so a crashed session resumes on the Questions it left.
export const toAppCompetitionActiveAttemptResponse = (
  served: ServedAttempt | null,
): AppCompetitionActiveAttemptResponse =>
  appCompetitionActiveAttemptResponseSchema.parse({
    attempt: served === null ? null : servedPayload(served),
  });

export const toAppCompetitionTranscriptResponse = (
  served: ServedAttempt,
  answers: NewCompetitionAnswer[],
): AppCompetitionTranscriptResponse => {
  const { attempt, questions } = served;
  return appCompetitionTranscriptResponseSchema.parse({
    id: attempt.id,
    day: attempt.day,
    kind: attempt.kind,
    ...themePayload(served),
    finalizeReason: attempt.finalizeReason,
    score: attempt.score,
    answers: answers.map((answer) => {
      const question = questions[answer.position];
      if (question === undefined) {
        throw new Error(`attempt ${attempt.id} lost its served question ${answer.questionId}`);
      }
      return {
        position: answer.position,
        questionId: answer.questionId,
        questionText: question.text,
        canonicalAnswer: question.answer,
        mode: answer.mode,
        rawInput: answer.rawInput,
        correct: answer.correct,
        points: answer.points,
        matchedVia: answer.matchedVia,
      };
    }),
  });
};

// Only the judged Attempts travel: the one still in play is the resume read's to serve.
export const toAppCompetitionDayResponse = (
  day: string,
  replay: boolean,
  catchup: boolean,
  todays: CompetitionAttemptEntity[],
): AppCompetitionDayResponse =>
  appCompetitionDayResponseSchema.parse({
    day,
    replay,
    catchup,
    attempts: todays
      .filter((attempt) => attempt.status === "finalized")
      .map(({ id, kind, score }) => ({ id, kind, score: score ?? 0 })),
  });
