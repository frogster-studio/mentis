import { squareChoices } from "@mentis/answer-matching";
import {
  type AppCompetitionActiveAttemptResponse,
  type AppCompetitionAttemptResponse,
  type AppCompetitionStandingResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionActiveAttemptResponseSchema,
  appCompetitionAttemptResponseSchema,
  appCompetitionStandingResponseSchema,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { DayScore } from "../types/day-score";
import type { NewCompetitionAnswer } from "../types/new-competition-answer";
import type { ServedAttempt } from "../types/served-attempt";
import type { ServedQuestion } from "../types/served-question";
import { seededRng } from "../utils/seeded-rng";

const servedPayload = ({ attempt, questions }: ServedAttempt) => ({
  id: attempt.id,
  day: attempt.day,
  kind: attempt.kind,
  status: attempt.status,
  themeId: attempt.themeId,
  themeName: attempt.themeName,
  questions: questions.map((question) => ({
    id: question.id,
    text: question.text,
    squareChoices: squareChoices(question, seededRng(`${attempt.id}:${question.id}`)),
  })),
});

// Parsing through the contract is what keeps the answer material off the wire.
export const toAppCompetitionAttemptResponse = (
  attempt: CompetitionAttemptEntity,
  questions: ServedQuestion[],
): AppCompetitionAttemptResponse =>
  appCompetitionAttemptResponseSchema.parse(servedPayload({ attempt, questions }));

// The same payload the issuance served, so a crashed session resumes on the Questions it left.
export const toAppCompetitionActiveAttemptResponse = (
  served: ServedAttempt | null,
): AppCompetitionActiveAttemptResponse =>
  appCompetitionActiveAttemptResponseSchema.parse({
    attempt: served === null ? null : servedPayload(served),
  });

export const toAppCompetitionTranscriptResponse = (
  attempt: CompetitionAttemptEntity,
  answers: NewCompetitionAnswer[],
  questions: ServedQuestion[],
): AppCompetitionTranscriptResponse =>
  appCompetitionTranscriptResponseSchema.parse({
    id: attempt.id,
    day: attempt.day,
    kind: attempt.kind,
    themeId: attempt.themeId,
    themeName: attempt.themeName,
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

export const toAppCompetitionStandingResponse = (
  season: string,
  seasonTotal: number,
  days: DayScore[],
): AppCompetitionStandingResponse =>
  appCompetitionStandingResponseSchema.parse({ season, seasonTotal, days });
