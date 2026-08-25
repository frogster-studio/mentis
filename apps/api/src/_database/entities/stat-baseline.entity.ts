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
import { AuthUserEntity } from "./auth-user.entity";

// One baseline per device per Theme, so a replayed Stats Transfer adds nothing.
@Unique("stat_baselines_one_per_device_theme", ["owner", "device", "themeId"])
@Entity("stat_baselines")
export class StatBaselineEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "uuid" })
  device: string;

  @Column({ type: "uuid", name: "theme_id" })
  themeId: string;

  @Column({ type: "varchar", length: 255, name: "theme_name" })
  themeName: string;

  @Column({ type: "integer", name: "total_points" })
  totalPoints: number;

  @Column({ type: "integer", name: "session_count" })
  sessionCount: number;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
