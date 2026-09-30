import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";

export type TimedAttempt = { entity: CompetitionAttemptEntity; durationMs: number | null };
