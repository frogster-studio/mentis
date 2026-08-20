import { Column, Entity, PrimaryColumn } from "typeorm";

export type CompetitionAnswerMode = "cash" | "square" | "none";
export type CompetitionMatchedVia = "canonical" | "alias" | "misspelling" | "fuzzy" | "choice";

@Entity("competition_answers")
export class CompetitionAnswerEntity {
  @PrimaryColumn("uuid", { name: "attempt_id" })
  attemptId!: string;

  @PrimaryColumn("smallint")
  position!: number;

  @Column("text", { name: "question_id" })
  questionId!: string;

  @Column("text")
  mode!: CompetitionAnswerMode;

  @Column("text", { name: "raw_input", nullable: true })
  rawInput!: string | null;

  @Column("boolean")
  correct!: boolean;

  @Column("smallint")
  points!: number;

  @Column("text", { name: "matched_via", nullable: true })
  matchedVia!: CompetitionMatchedVia | null;

  @Column("integer", { name: "client_elapsed_ms", nullable: true })
  clientElapsedMs!: number | null;
}
