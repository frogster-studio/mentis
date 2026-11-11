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

  // A path inside the anecdote-images bucket, never a URL — the API composes that.
  @Column({ type: "varchar", length: 255, nullable: true })
  image: string | null;

  @UpdateDateColumn({ type: "timestamptz", name: "updated_at" })
  updatedAt: Date;

  @CreateDateColumn({ type: "timestamptz", name: "created_at" })
  createdAt: Date;
}
