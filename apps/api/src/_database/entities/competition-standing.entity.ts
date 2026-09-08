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
  Unique,
  UpdateDateColumn,
} from "typeorm";
import { AuthUserEntity } from "./auth-user.entity";

// A backward scan supplies descending totals within the selected Season.
@Index("competition_standings_season_total_idx", ["season", "total"])
@Unique("competition_standings_one_per_owner_season", ["owner", "season"])
@Entity("competition_standings")
export class CompetitionStandingEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "varchar", length: 7 })
  season: string;

  @Column({ type: "integer" })
  total: number;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
