import type { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import type { ThemeVisuals } from "../../catalog/types/theme-visuals";
import type { ServedQuestion } from "./served-question";

export type ServedAttempt = {
  attempt: CompetitionAttemptEntity;
  theme: ThemeVisuals;
  questions: ServedQuestion[];
};
