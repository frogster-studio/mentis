import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export type CardType = "quiz" | "true-false" | "anecdote" | "did-you-know" | "riddle";
export type CardNetwork = "x" | "linkedin" | "facebook" | "tiktok" | "youtube" | "instagram";

@Entity("cards")
export class CardEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column("text")
  type!: CardType;

  @Column("text")
  title!: string;

  @Column("text", { array: true })
  tags!: string[];

  @Column("jsonb")
  payload!: Record<string, unknown>;

  @Column("jsonb")
  images!: { path: string }[];

  @Column({ type: "timestamptz", name: "created_at", insert: false, update: false })
  createdAt!: Date;

  @Column({ type: "timestamptz", name: "updated_at", insert: false, update: false })
  updatedAt!: Date;

  @Column("text", { name: "posted_on", array: true })
  postedOn!: CardNetwork[];
}
