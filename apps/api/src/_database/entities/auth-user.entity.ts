import { Entity, PrimaryColumn } from "typeorm";

// Supabase Auth owns this table; mirroring it read-only keeps the player tables' delete cascade in the generated schema.
@Entity({ schema: "auth", name: "users", synchronize: false })
export class AuthUserEntity {
  @PrimaryColumn("uuid")
  id!: string;
}
