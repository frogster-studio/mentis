import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("anecdotes")
export class AnecdoteEntity extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // The ** and __ markers count in the 140.
  @Column({ type: "varchar", length: 140 })
  text: string;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
