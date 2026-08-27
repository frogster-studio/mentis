import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";
import { CompetitionAnswerEntity } from "./competition-answer.entity";

export const COMPETITION_ATTEMPT_KINDS = ["initial", "replay", "catchup"] as const;
export type CompetitionAttemptKind = (typeof COMPETITION_ATTEMPT_KINDS)[number];

export const COMPETITION_ATTEMPT_STATUSES = ["active", "finalized"] as const;
export type CompetitionAttemptStatus = (typeof COMPETITION_ATTEMPT_STATUSES)[number];

export const COMPETITION_FINALIZE_REASONS = ["completed", "quit", "expired"] as const;
export type CompetitionFinalizeReason = (typeof COMPETITION_FINALIZE_REASONS)[number];

@Index("competition_attempts_owner_day_idx", ["owner", "day"])
@Index("competition_attempts_day_idx", ["day"])
// A Competition Day holds at most one Attempt per kind, so a repeated ask returns the first.
@Unique("competition_attempts_one_per_kind", ["owner", "day", "kind"])
@Entity("competition_attempts")
export class CompetitionAttemptEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "date" })
  day: string;

  @Column({ type: "enum", enum: [...COMPETITION_ATTEMPT_KINDS] })
  kind: CompetitionAttemptKind;

  @Column({ type: "uuid", name: "theme_id" })
  themeId: string;

  @Column({ type: "varchar", length: 255, name: "theme_name" })
  themeName: string;

  @Column({ type: "uuid", array: true, name: "question_ids" })
  questionIds: string[];

  @Column({ type: "enum", enum: [...COMPETITION_ATTEMPT_STATUSES], default: "active" })
  status: CompetitionAttemptStatus;

  @Column({
    type: "enum",
    enum: [...COMPETITION_FINALIZE_REASONS],
    name: "finalize_reason",
    nullable: true,
  })
  finalizeReason: CompetitionFinalizeReason | null;

  @Column({ type: "integer", nullable: true })
  score: number | null;

  @Column({ type: "timestamptz", name: "issued_at", default: () => "now()" })
  issuedAt: Date;

  @Column({ type: "timestamptz", name: "finalized_at", nullable: true })
  finalizedAt: Date | null;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @OneToMany(
    () => CompetitionAnswerEntity,
    (answer) => answer.attempt,
  )
  answers: Relation<CompetitionAnswerEntity[]>;
}
