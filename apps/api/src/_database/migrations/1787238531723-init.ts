import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1787238531723 implements MigrationInterface {
  name = "Init1787238531723";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" text NOT NULL, "title" text NOT NULL, "tags" text array NOT NULL, "payload" jsonb NOT NULL, "images" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL, "posted_on" text array NOT NULL, CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "themes" ("id" text NOT NULL, "name" text NOT NULL, CONSTRAINT "PK_ddbeaab913c18682e5c88155592" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_sessions" ("id" uuid NOT NULL, "owner" uuid NOT NULL, "theme_id" text NOT NULL, "theme_name" text NOT NULL, "points" integer NOT NULL, "finished_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_db4ac35661dd2f29269b272a4c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "competition_answers" ("attempt_id" uuid NOT NULL, "position" smallint NOT NULL, "question_id" text NOT NULL, "mode" text NOT NULL, "raw_input" text, "correct" boolean NOT NULL, "points" smallint NOT NULL, "matched_via" text, "client_elapsed_ms" integer, CONSTRAINT "PK_3ba7ba2aff95ae0c32d071e11f2" PRIMARY KEY ("attempt_id", "position"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "stat_baselines" ("owner" uuid NOT NULL, "device" uuid NOT NULL, "theme_id" text NOT NULL, "theme_name" text NOT NULL, "total_points" integer NOT NULL, "session_count" integer NOT NULL, CONSTRAINT "PK_0c958fdb164109c576f19087a20" PRIMARY KEY ("owner", "device", "theme_id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" text NOT NULL, "theme_id" text NOT NULL, "text" text NOT NULL, "answer" text NOT NULL, "aliases" text array NOT NULL, "misspellings" text array NOT NULL, "wrong_choices" text array NOT NULL, CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "competition_attempts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "owner" uuid NOT NULL, "day" date NOT NULL, "kind" text NOT NULL, "theme_id" text NOT NULL, "theme_name" text NOT NULL, "question_ids" text array NOT NULL, "status" text NOT NULL, "finalize_reason" text, "score" integer, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL, "finalized_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_4824ff07391ebae4d8afccc5989" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "competition_attempts"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "stat_baselines"`);
    await queryRunner.query(`DROP TABLE "competition_answers"`);
    await queryRunner.query(`DROP TABLE "quiz_sessions"`);
    await queryRunner.query(`DROP TABLE "themes"`);
    await queryRunner.query(`DROP TABLE "cards"`);
  }
}
