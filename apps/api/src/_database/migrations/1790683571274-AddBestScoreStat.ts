import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBestScoreStat1790683571274 implements MigrationInterface {
  name = "AddBestScoreStat1790683571274";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stat_baselines" ADD "best_score" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "stat_baselines" DROP COLUMN "best_score"`);
  }
}
