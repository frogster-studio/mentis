import { MigrationInterface, QueryRunner } from "typeorm";

export class AddQuestionCountInQuizTable1790775124717 implements MigrationInterface {
  name = "AddQuestionCountInQuizTable1790775124717";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions" ADD "question_count" smallint NOT NULL DEFAULT '10'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "quiz_sessions" DROP COLUMN "question_count"`);
  }
}
