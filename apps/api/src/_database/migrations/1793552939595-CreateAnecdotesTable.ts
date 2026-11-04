import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateAnecdotesTable1793552939595 implements MigrationInterface {
  name = "CreateAnecdotesTable1793552939595";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "anecdotes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "text" character varying(140) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_8c21d66dc4a7621285c3fd37180" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "anecdotes"`);
  }
}
