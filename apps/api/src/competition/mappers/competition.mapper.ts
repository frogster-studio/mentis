import { squareChoices } from "@mentis/answer-matching";
import {
  type AppCompetitionAttemptResponse,
  appCompetitionAttemptResponseSchema,
} from "@mentis/contracts/app";
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
