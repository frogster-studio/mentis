import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("questions")
export class QuestionEntity {
  @PrimaryColumn("text")
  id!: string;

  @Column("text", { name: "theme_id" })
  themeId!: string;

  @Column("text")
  text!: string;

  @Column("text")
  answer!: string;

  @Column("text", { array: true })
  aliases!: string[];

  @Column("text", { array: true })
  misspellings!: string[];

  @Column("text", { name: "wrong_choices", array: true })
  wrongChoices!: string[];
}
