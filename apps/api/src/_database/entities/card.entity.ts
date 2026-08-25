import { CARD_TYPES, type CardType, SOCIALS, type Social } from "@mentis/contracts/admin";
import { BaseEntity, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

// The list is always sorted by last update descending.
@Index("cards_updated_at_idx", ["updatedAt"])
@Entity("cards")
export class CardEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: [...CARD_TYPES] })
  type: CardType;

  @Column({ type: "varchar", length: 255 })
  title: string;

  @Column({ type: "varchar", length: 255, array: true, default: [] })
  tags: string[];

  @Column({ type: "jsonb", default: {} })
  payload: object;

  @Column({ type: "jsonb", default: [] })
  images: { path: string }[];

  @Column({ type: "enum", enum: [...SOCIALS], array: true, name: "posted_on", default: [] })
  postedOn: Social[];

  // The set_updated_at trigger owns this column, so marking a Card posted never reorders the library.
  @Column({
    type: "timestamptz",
    name: "updated_at",
    default: () => "now()",
    insert: false,
    update: false,
  })
  updatedAt: Date;

  @Column({
    type: "timestamptz",
    name: "created_at",
    default: () => "now()",
    insert: false,
    update: false,
  })
  createdAt: Date;
}
