import { BaseEntity, Entity, PrimaryColumn } from "typeorm";

// Supabase Auth owns this table; mirroring it read-only keeps the player tables' delete cascade in the generated schema.
@Entity({ schema: "auth", name: "users", synchronize: false })
export class AuthUserEntity extends BaseEntity {
  @PrimaryColumn({ type: "uuid" })
  id: string;
}
