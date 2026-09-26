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

// One row per device per Paris day, so a replayed Stats Transfer adds nothing.
@Unique("practice_days_one_per_device_day", ["owner", "device", "day"])
@Entity("practice_days")
export class PracticeDayEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "uuid" })
  device: string;

  @Column({ type: "date" })
  day: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
