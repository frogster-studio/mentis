import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import type { CompetitionFinalizeReason } from "../../_database/entities/competition-attempt.entity";

export type FinalizedOutcome = {
  reason: CompetitionFinalizeReason;
  score: number;
  answers: CompetitionAnswerEntity[];
};
