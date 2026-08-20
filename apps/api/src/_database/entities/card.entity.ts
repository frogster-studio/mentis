import { Check, Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type CardType = "quiz" | "true-false" | "anecdote" | "did-you-know" | "riddle";
export type CardNetwork = "x" | "linkedin" | "facebook" | "tiktok" | "youtube" | "instagram";

// The list is always sorted by last update descending.
@Index("cards_updated_at_idx", ["updatedAt"])
@Check("cards_type_known", "type in ('quiz', 'true-false', 'anecdote', 'did-you-know', 'riddle')")
@Check("cards_title_not_blank", "length(trim(title)) > 0")
@Check(
  "cards_posted_on_known_networks",
  "posted_on <@ array['x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'instagram']::text[]",
)
@Entity("cards")
export class CardEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  type!: CardType;

  @Column("text")
  title!: string;

  @Column("text", { array: true, default: () => "'{}'" })
  tags!: string[];

  @Column("jsonb", { default: () => "'{}'" })
  payload!: object;

  @Column("jsonb", { default: () => "'[]'" })
  images!: { path: string }[];

  @Column({
    type: "timestamptz",
    name: "created_at",
    default: () => "now()",
    insert: false,
    update: false,
  })
  createdAt!: Date;

  @Column({
    type: "timestamptz",
    name: "updated_at",
    default: () => "now()",
    insert: false,
    update: false,
  })
  updatedAt!: Date;

  @Column("text", { name: "posted_on", array: true, default: () => "'{}'" })
  postedOn!: CardNetwork[];
}
