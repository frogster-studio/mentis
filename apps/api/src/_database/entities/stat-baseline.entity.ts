import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("stat_baselines")
export class StatBaselineEntity {
  @PrimaryColumn("uuid")
  owner!: string;

  @PrimaryColumn("uuid")
  device!: string;

  @PrimaryColumn("text", { name: "theme_id" })
  themeId!: string;

  @Column("text", { name: "theme_name" })
  themeName!: string;

  @Column("integer", { name: "total_points" })
  totalPoints!: number;

  @Column("integer", { name: "session_count" })
  sessionCount!: number;
}
