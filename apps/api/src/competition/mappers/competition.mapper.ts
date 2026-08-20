import { squareChoices } from "@mentis/answer-matching";
import {
  type AppCompetitionAttemptResponse,
  type AppCompetitionTranscriptResponse,
  appCompetitionAttemptResponseSchema,
  appCompetitionTranscriptResponseSchema,
} from "@mentis/contracts/app";
import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { seededRng } from "../services/seeded-rng";

export type ServedQuestion = {
  id: string;
  text: string;
  answer: string;
  wrongChoices: string[];
};

// Parsing through the contract is what keeps the answer material off the wire.
export const toAppCompetitionAttemptResponse = (
  attempt: CompetitionAttemptEntity,
  questions: ServedQuestion[],
): AppCompetitionAttemptResponse =>
  appCompetitionAttemptResponseSchema.parse({
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

export const toAppCompetitionTranscriptResponse = (
  attempt: CompetitionAttemptEntity,
  answers: CompetitionAnswerEntity[],
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
