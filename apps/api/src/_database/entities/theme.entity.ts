import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity("themes")
export class ThemeEntity {
  @PrimaryColumn("text")
  id!: string;

  @Column("text")
  name!: string;
}
