import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { ServedQuestion } from "./served-question";

export type ServedAttempt = { attempt: CompetitionAttemptEntity; questions: ServedQuestion[] };
