import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatePracticeDaysTable1790422811103 implements MigrationInterface {
  name = "CreatePracticeDaysTable1790422811103";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "practice_days" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "device" uuid NOT NULL, "day" date NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "practice_days_one_per_device_day" UNIQUE ("owner", "device", "day"), CONSTRAINT "PK_d7457b743ef6f7db37d7e37040f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "practice_days" ADD CONSTRAINT "FK_898b3a11213e896bffb8869c39c" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "practice_days" DROP CONSTRAINT "FK_898b3a11213e896bffb8869c39c"`,
    );
    await queryRunner.query(`DROP TABLE "practice_days"`);
  }
}
