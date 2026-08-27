import { QuizAnswerModeEnum, UserAnswerMatchedViaEnum } from "@mentis/contracts/enums";
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { CompetitionAttemptEntity } from "./competition-attempt.entity";

// An Attempt answers each position once, so a replayed finalize adds nothing.
@Unique("competition_answers_one_per_position", ["attemptId", "position"])
@Entity("competition_answers")
export class CompetitionAnswerEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "attempt_id" })
  attemptId: string;

  @ManyToOne(
    () => CompetitionAttemptEntity,
    (attempt) => attempt.answers,
    { nullable: false, onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "attempt_id" })
  attempt: Relation<CompetitionAttemptEntity>;

  @Column({ type: "smallint" })
  position: number;

  @Column({ type: "uuid", name: "question_id" })
  questionId: string;

  @Column({ type: "enum", enum: QuizAnswerModeEnum })
  mode: QuizAnswerModeEnum;

  @Column({ type: "varchar", length: 255, name: "raw_input", nullable: true })
  rawInput: string | null;

  @Column({ type: "boolean" })
  correct: boolean;

  @Column({ type: "smallint" })
  points: number;

  @Column({
    type: "enum",
    enum: UserAnswerMatchedViaEnum,
    name: "matched_via",
    nullable: true,
  })
  matchedVia: UserAnswerMatchedViaEnum | null;

  @Column({ type: "integer", name: "client_elapsed_ms", nullable: true })
  clientElapsedMs: number | null;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
