import type {
  CompetitionAttemptKind,
  CompetitionAttemptStatus,
} from "../../_database/entities/competition-attempt.entity";

export type DayAttempt = { kind: CompetitionAttemptKind; status: CompetitionAttemptStatus };
