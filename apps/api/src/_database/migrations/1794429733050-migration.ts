import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1794429733050 implements MigrationInterface {
  name = "Migration1794429733050";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "anecdotes" ADD "image" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "anecdotes" DROP COLUMN "image"`);
  }
}
