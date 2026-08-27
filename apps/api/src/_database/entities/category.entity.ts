import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from "typeorm";
import { ThemeEntity } from "./theme.entity";

@Entity("categories")
export class CategoryEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 255, unique: true })
  slug: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  // Seven characters is a lowercase #rrggbb and nothing else.
  @Column({ type: "varchar", length: 7 })
  color: string;

  @Column({ type: "varchar", length: 255 })
  icon: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;

  @OneToMany(
    () => ThemeEntity,
    (theme) => theme.category,
  )
  themes: Relation<ThemeEntity[]>;
}
