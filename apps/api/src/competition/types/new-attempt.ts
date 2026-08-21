import type { CompetitionAttemptKind } from "../../_database/entities/competition-attempt.entity";

export type NewAttempt = {
  owner: string;
  day: string;
  kind: CompetitionAttemptKind;
  themeId: string;
  themeName: string;
  questionIds: string[];
};
