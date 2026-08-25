import type { CompetitionFinalizeReason } from "../../_database/entities/competition-attempt.entity";
import type { NewCompetitionAnswer } from "./new-competition-answer";

export type FinalizedOutcome = {
  reason: CompetitionFinalizeReason;
  score: number;
  answers: NewCompetitionAnswer[];
};
