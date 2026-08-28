import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { CategoryEntity } from "./category.entity";
import { QuestionEntity } from "./question.entity";

@Entity("themes")
export class ThemeEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "uuid", name: "category_id" })
  categoryId: string;

  // RESTRICT, not CASCADE: dropping a Category must never take its Themes with it.
  @ManyToOne(
    () => CategoryEntity,
    (category) => category.themes,
    { nullable: false, onDelete: "RESTRICT" },
  )
  @JoinColumn({ name: "category_id" })
  category: Relation<CategoryEntity>;

  // A path inside the theme-images bucket, never a URL — the API composes that.
  @Column({ type: "varchar", length: 255 })
  image: string;

  @Column({ type: "boolean", default: false })
  published: boolean;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @OneToMany(
    () => QuestionEntity,
    (question) => question.theme,
  )
  questions: Relation<QuestionEntity[]>;
}
