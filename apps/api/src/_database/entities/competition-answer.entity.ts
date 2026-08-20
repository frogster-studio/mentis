import { Check, Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { CompetitionAttemptEntity } from "./competition-attempt.entity";

export type CompetitionAnswerMode = "cash" | "square" | "none";
export type CompetitionMatchedVia = "canonical" | "alias" | "misspelling" | "fuzzy" | "choice";

@Check("competition_answers_mode_known", "mode in ('cash', 'square', 'none')")
@Check(
  "competition_answers_matched_via_known",
  "matched_via in ('canonical', 'alias', 'misspelling', 'fuzzy', 'choice')",
)
@Entity("competition_answers")
export class CompetitionAnswerEntity {
  @PrimaryColumn("uuid", { name: "attempt_id" })
  attemptId!: string;

  @ManyToOne(() => CompetitionAttemptEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "attempt_id" })
  attempt?: CompetitionAttemptEntity;

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
