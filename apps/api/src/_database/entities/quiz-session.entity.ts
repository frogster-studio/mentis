import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("quiz_sessions")
export class QuizSessionEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column("uuid")
  owner!: string;

  @Column("text", { name: "theme_id" })
  themeId!: string;

  @Column("text", { name: "theme_name" })
  themeName!: string;

  @Column("integer")
  points!: number;

  @Column("timestamptz", { name: "finished_at" })
  finishedAt!: Date;
}
