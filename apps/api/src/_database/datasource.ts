import type { DataSourceOptions } from "typeorm";
import type { Env } from "../env";
import { CardEntity } from "./entities/card.entity";
import { CompetitionAnswerEntity } from "./entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "./entities/competition-attempt.entity";
import { QuestionEntity } from "./entities/question.entity";
import { QuizSessionEntity } from "./entities/quiz-session.entity";
import { StatBaselineEntity } from "./entities/stat-baseline.entity";
import { ThemeEntity } from "./entities/theme.entity";

// Entities mirror supabase/migrations by hand — the schema is the source of truth (ADR 0005).
export const dataSourceOptions = (env: Env): DataSourceOptions => ({
  type: "postgres",
  url: env.DATABASE_URL,
  entities: [
    CardEntity,
    ThemeEntity,
    QuestionEntity,
    QuizSessionEntity,
    StatBaselineEntity,
    CompetitionAttemptEntity,
    CompetitionAnswerEntity,
  ],
  synchronize: false,
});
