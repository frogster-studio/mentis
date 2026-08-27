import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";

@Index("quiz_sessions_owner_idx", ["owner"])
@Entity("quiz_sessions")
export class QuizSessionEntity extends BaseEntity {
  // The phone mints this id so a retried push lands on the same row.
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "uuid", name: "theme_id" })
  themeId: string;

  @Column({ type: "varchar", length: 255, name: "theme_name" })
  themeName: string;

  @Column({ type: "integer" })
  points: number;

  @Column({ type: "timestamptz", name: "finished_at" })
  finishedAt: Date;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
