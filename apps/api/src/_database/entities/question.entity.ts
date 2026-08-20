import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { ThemeEntity } from "./theme.entity";

@Index("questions_theme_id_idx", ["themeId"])
@Check("questions_exactly_3_wrong_choices", "cardinality(wrong_choices) = 3")
@Entity("questions")
export class QuestionEntity {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { name: "theme_id" })
  themeId!: string;

  @ManyToOne(() => ThemeEntity, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "theme_id" })
  theme?: ThemeEntity;

  @Column("text")
  text!: string;

  @Column("text")
  answer!: string;

  @Column("text", { array: true, default: () => "'{}'" })
  aliases!: string[];

  @Column("text", { array: true, default: () => "'{}'" })
  misspellings!: string[];

  @Column("text", { name: "wrong_choices", array: true })
  wrongChoices!: string[];
}
