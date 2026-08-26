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

// One mirrored row per Account, so a re-sync upserts in place.
@Unique("premium_entitlements_one_per_owner", ["owner"])
@Entity("premium_entitlements")
export class PremiumEntitlementEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  owner: string;

  @ManyToOne(() => AuthUserEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "owner" })
  ownerUser: Relation<AuthUserEntity>;

  @Column({ type: "timestamptz", name: "premium_until", nullable: true })
  premiumUntil: Date | null;

  // The store world backing premium, straight from RevenueCat; null whenever premium_until is.
  @Column({ type: "enum", enum: ["SANDBOX", "PRODUCTION"], nullable: true })
  environment: "SANDBOX" | "PRODUCTION" | null;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
