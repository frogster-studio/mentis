import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";

@Index("quiz_sessions_owner_idx", ["owner"])
@Entity("quiz_sessions")
export class QuizSessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  owner!: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser?: AuthUserEntity;

  @Column("text", { name: "theme_id" })
  themeId!: string;

  @Column("text", { name: "theme_name" })
  themeName!: string;

  @Column("integer")
  points!: number;

  @Column("timestamptz", { name: "finished_at" })
  finishedAt!: Date;
}
