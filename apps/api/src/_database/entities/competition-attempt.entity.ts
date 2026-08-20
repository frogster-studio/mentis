import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type CompetitionAttemptKind = "initial" | "replay" | "catchup";
export type CompetitionAttemptStatus = "active" | "finalized";
export type CompetitionFinalizeReason = "completed" | "quit" | "expired";

@Entity("competition_attempts")
export class CompetitionAttemptEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  owner!: string;

  @Column("date")
  day!: string;

  @Column("text")
  kind!: CompetitionAttemptKind;

  @Column("text", { name: "theme_id" })
  themeId!: string;

  @Column("text", { name: "theme_name" })
  themeName!: string;

  @Column("text", { name: "question_ids", array: true })
  questionIds!: string[];

  @Column("text")
  status!: CompetitionAttemptStatus;

  @Column("text", { name: "finalize_reason", nullable: true })
  finalizeReason!: CompetitionFinalizeReason | null;

  @Column("integer", { nullable: true })
  score!: number | null;

  @Column({ type: "timestamptz", name: "issued_at", insert: false, update: false })
  issuedAt!: Date;

  @Column("timestamptz", { name: "finalized_at", nullable: true })
  finalizedAt!: Date | null;
}
