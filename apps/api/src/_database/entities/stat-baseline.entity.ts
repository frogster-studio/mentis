import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";

@Entity("stat_baselines")
export class StatBaselineEntity {
  @PrimaryColumn("uuid")
  owner!: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser?: AuthUserEntity;

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
