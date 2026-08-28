import { MigrationInterface, QueryRunner } from "typeorm";

export class ThemesQuestionPublished1787904229651 implements MigrationInterface {
  name = "ThemesQuestionPublished1787904229651";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "themes" ADD "published" boolean NOT NULL DEFAULT false`);
    await queryRunner.query(
      `ALTER TABLE "questions" ADD "ready_to_be_published" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "questions" DROP COLUMN "ready_to_be_published"`);
    await queryRunner.query(`ALTER TABLE "themes" DROP COLUMN "published"`);
  }
}
