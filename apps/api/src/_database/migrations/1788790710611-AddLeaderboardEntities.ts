import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLeaderboardEntities1788790710611 implements MigrationInterface {
  name = "AddLeaderboardEntities1788790710611";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "competition_standings" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "season" character varying(7) NOT NULL, "total" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "competition_standings_one_per_owner_season" UNIQUE ("owner", "season"), CONSTRAINT "PK_fd15292dd24cfc721e48fb3e1e7" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "competition_standings_season_total_idx" ON "competition_standings"  ("season", "total") `,
    );
    await queryRunner.query(
      `CREATE TABLE "player_profiles" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "pseudo" character varying(20) NOT NULL, "pseudo_key" character varying(20) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "player_profiles_pseudo_key_unique" UNIQUE ("pseudo_key"), CONSTRAINT "player_profiles_one_per_owner" UNIQUE ("owner"), CONSTRAINT "PK_60488bbe49c4612fce78e0a1875" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_standings" ADD CONSTRAINT "FK_b7699db1bb5dabaa595b9d1f39d" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "player_profiles" ADD CONSTRAINT "FK_2bf5468c10b58386bffc4520a6a" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "player_profiles" DROP CONSTRAINT "FK_2bf5468c10b58386bffc4520a6a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_standings" DROP CONSTRAINT "FK_b7699db1bb5dabaa595b9d1f39d"`,
    );
    await queryRunner.query(`DROP TABLE "player_profiles"`);
    await queryRunner.query(`DROP INDEX "public"."competition_standings_season_total_idx"`);
    await queryRunner.query(`DROP TABLE "competition_standings"`);
  }
}
