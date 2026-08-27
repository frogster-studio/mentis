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
  UpdateDateColumn,
} from "typeorm";
import { ThemeEntity } from "./theme.entity";

@Index("questions_theme_id_idx", ["themeId"])
@Entity("questions")
export class QuestionEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "theme_id" })
  themeId: string;

  @ManyToOne(
    () => ThemeEntity,
    (theme) => theme.questions,
    { nullable: false, onDelete: "CASCADE" },
  )
  @JoinColumn({ name: "theme_id" })
  theme: Relation<ThemeEntity>;

  @Column({ type: "text" })
  text: string;

  @Column({ type: "varchar", length: 255 })
  answer: string;

  @Column({ type: "varchar", length: 255, array: true, default: [] })
  aliases: string[];

  @Column({ type: "varchar", length: 255, array: true, default: [] })
  misspellings: string[];

  @Column({ type: "varchar", length: 255, array: true, name: "wrong_choices", default: [] })
  wrongChoices: string[];

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
