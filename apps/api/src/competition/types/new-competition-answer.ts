import type { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";

// A judged answer before it is a row: no id, no timestamps, no hydrated attempt.
export type NewCompetitionAnswer = Pick<
  CompetitionAnswerEntity,
  | "attemptId"
  | "position"
  | "questionId"
  | "mode"
  | "rawInput"
  | "correct"
  | "points"
  | "matchedVia"
  | "clientElapsedMs"
>;
