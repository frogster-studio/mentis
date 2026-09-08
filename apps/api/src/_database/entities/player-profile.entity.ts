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

@Unique("player_profiles_one_per_owner", ["owner"])
@Unique("player_profiles_pseudo_key_unique", ["pseudoKey"])
@Entity("player_profiles")
export class PlayerProfileEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "varchar", length: 20 })
  pseudo: string;

  @Column({ type: "varchar", length: 20, name: "pseudo_key" })
  pseudoKey: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
