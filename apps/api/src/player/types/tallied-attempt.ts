import type { CompetitionAttemptStatus } from "../../_database/entities/competition-attempt.entity";

export type TalliedAttempt = {
  themeId: string;
  status: CompetitionAttemptStatus;
  score: number | null;
  issuedAt: Date;
};
