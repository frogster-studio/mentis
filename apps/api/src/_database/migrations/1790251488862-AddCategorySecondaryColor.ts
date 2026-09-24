import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategorySecondaryColor1790251488862 implements MigrationInterface {
  name = "AddCategorySecondaryColor1790251488862";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "categories" ADD "secondary_color" character varying(7) NOT NULL DEFAULT '#ffffff'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "categories" DROP COLUMN "secondary_color"`);
  }
}
