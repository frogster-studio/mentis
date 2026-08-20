import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";

export type CompetitionAttemptKind = "initial" | "replay" | "catchup";
export type CompetitionAttemptStatus = "active" | "finalized";
export type CompetitionFinalizeReason = "completed" | "quit" | "expired";

@Index("competition_attempts_owner_day_idx", ["owner", "day"])
@Index("competition_attempts_day_idx", ["day"])
// A Competition Day holds at most one Attempt per kind, so a repeated ask returns the first.
@Unique("competition_attempts_one_per_kind", ["owner", "day", "kind"])
@Check("competition_attempts_kind_known", "kind in ('initial', 'replay', 'catchup')")
@Check("competition_attempts_status_known", "status in ('active', 'finalized')")
@Check(
  "competition_attempts_finalize_reason_known",
  "finalize_reason in ('completed', 'quit', 'expired')",
)
@Check("competition_attempts_ten_questions", "cardinality(question_ids) = 10")
@Entity("competition_attempts")
export class CompetitionAttemptEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("uuid")
  owner!: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser?: AuthUserEntity;

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

  @Column("text", { default: "active" })
  status!: CompetitionAttemptStatus;

  @Column("text", { name: "finalize_reason", nullable: true })
  finalizeReason!: CompetitionFinalizeReason | null;

  @Column("integer", { nullable: true })
  score!: number | null;

  @Column({
    type: "timestamptz",
    name: "issued_at",
    default: () => "now()",
    insert: false,
    update: false,
  })
  issuedAt!: Date;

  @Column("timestamptz", { name: "finalized_at", nullable: true })
  finalizedAt!: Date | null;
}
