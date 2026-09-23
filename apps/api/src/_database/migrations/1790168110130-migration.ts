import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1790168110130 implements MigrationInterface {
  name = "Migration1790168110130";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" ADD "explanation" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "explanation"`);
  }
}
