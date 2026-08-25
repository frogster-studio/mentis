import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1787678528931 implements MigrationInterface {
  name = "Init1787678528931";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."cards_type_enum" AS ENUM('quiz', 'true-false', 'anecdote', 'did-you-know', 'riddle')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."cards_posted_on_enum" AS ENUM('x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'instagram')`,
    );
    await queryRunner.query(
      `CREATE TABLE "cards" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "type" "public"."cards_type_enum" NOT NULL, "title" character varying(255) NOT NULL, "tags" character varying(255) array NOT NULL DEFAULT '{}', "payload" jsonb NOT NULL DEFAULT '{}', "images" jsonb NOT NULL DEFAULT '[]', "posted_on" "public"."cards_posted_on_enum" array NOT NULL DEFAULT '{}', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5f3269634705fdff4a9935860fc" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "cards_updated_at_idx" ON "cards"  ("updated_at") `);
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "slug" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "color" character varying(7) NOT NULL, "icon" character varying(255) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_420d9f679d41281f282f5bc7d09" UNIQUE ("slug"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "themes" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "slug" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "category_id" uuid NOT NULL, "image" character varying(255) NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_0334884c335ef967c5dcff304f5" UNIQUE ("slug"), CONSTRAINT "PK_ddbeaab913c18682e5c88155592" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "questions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "theme_id" uuid NOT NULL, "text" text NOT NULL, "answer" character varying(255) NOT NULL, "aliases" character varying(255) array NOT NULL DEFAULT '{}', "misspellings" character varying(255) array NOT NULL DEFAULT '{}', "wrong_choices" character varying(255) array NOT NULL DEFAULT '{}', "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_08a6d4b0f49ff300bf3a0ca60ac" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(`CREATE INDEX "questions_theme_id_idx" ON "questions"  ("theme_id") `);
    await queryRunner.query(
      `CREATE TABLE "stat_baselines" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "device" uuid NOT NULL, "theme_id" uuid NOT NULL, "theme_name" character varying(255) NOT NULL, "total_points" integer NOT NULL, "session_count" integer NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "stat_baselines_one_per_device_theme" UNIQUE ("owner", "device", "theme_id"), CONSTRAINT "PK_04653c33fd93ef482ab3fb550b0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."competition_answers_mode_enum" AS ENUM('CASH', 'SQUARE', 'NONE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."competition_answers_matched_via_enum" AS ENUM('CANONICAL', 'ALIAS', 'MISSPELLING', 'FUZZY', 'CHOICE')`,
    );
    await queryRunner.query(
      `CREATE TABLE "competition_answers" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "attempt_id" uuid NOT NULL, "position" smallint NOT NULL, "question_id" uuid NOT NULL, "mode" "public"."competition_answers_mode_enum" NOT NULL, "raw_input" character varying(255), "correct" boolean NOT NULL, "points" smallint NOT NULL, "matched_via" "public"."competition_answers_matched_via_enum", "client_elapsed_ms" integer, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "competition_answers_one_per_position" UNIQUE ("attempt_id", "position"), CONSTRAINT "PK_66173311c4768ae8ab92b04efbd" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."competition_attempts_kind_enum" AS ENUM('initial', 'replay', 'catchup')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."competition_attempts_status_enum" AS ENUM('active', 'finalized')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."competition_attempts_finalize_reason_enum" AS ENUM('completed', 'quit', 'expired')`,
    );
    await queryRunner.query(
      `CREATE TABLE "competition_attempts" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "day" date NOT NULL, "kind" "public"."competition_attempts_kind_enum" NOT NULL, "theme_id" uuid NOT NULL, "theme_name" character varying(255) NOT NULL, "question_ids" uuid array NOT NULL, "status" "public"."competition_attempts_status_enum" NOT NULL DEFAULT 'active', "finalize_reason" "public"."competition_attempts_finalize_reason_enum", "score" integer, "issued_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "finalized_at" TIMESTAMP WITH TIME ZONE, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "competition_attempts_one_per_kind" UNIQUE ("owner", "day", "kind"), CONSTRAINT "PK_4824ff07391ebae4d8afccc5989" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "competition_attempts_day_idx" ON "competition_attempts"  ("day") `,
    );
    await queryRunner.query(
      `CREATE INDEX "competition_attempts_owner_day_idx" ON "competition_attempts"  ("owner", "day") `,
    );
    await queryRunner.query(
      `CREATE TABLE "quiz_sessions" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "owner" uuid NOT NULL, "theme_id" uuid NOT NULL, "theme_name" character varying(255) NOT NULL, "points" integer NOT NULL, "finished_at" TIMESTAMP WITH TIME ZONE NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_db4ac35661dd2f29269b272a4c2" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "quiz_sessions_owner_idx" ON "quiz_sessions"  ("owner") `,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" ADD CONSTRAINT "FK_01f4d245f56b7de807280791f05" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_e33a5129cc01279299076fc7c05" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stat_baselines" ADD CONSTRAINT "FK_c35d9043c1439d70c92195ecd31" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" ADD CONSTRAINT "FK_e3ee1bffa7226995dbc1756b3df" FOREIGN KEY ("attempt_id") REFERENCES "competition_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "FK_d583a3e338196b0d750f4aebf73" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions" ADD CONSTRAINT "FK_2ea2bf9290e5526cf207c60c3a4" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions" DROP CONSTRAINT "FK_2ea2bf9290e5526cf207c60c3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "FK_d583a3e338196b0d750f4aebf73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" DROP CONSTRAINT "FK_e3ee1bffa7226995dbc1756b3df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "stat_baselines" DROP CONSTRAINT "FK_c35d9043c1439d70c92195ecd31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_e33a5129cc01279299076fc7c05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "themes" DROP CONSTRAINT "FK_01f4d245f56b7de807280791f05"`,
    );
    await queryRunner.query(`DROP INDEX "public"."quiz_sessions_owner_idx"`);
    await queryRunner.query(`DROP TABLE "quiz_sessions"`);
    await queryRunner.query(`DROP INDEX "public"."competition_attempts_owner_day_idx"`);
    await queryRunner.query(`DROP INDEX "public"."competition_attempts_day_idx"`);
    await queryRunner.query(`DROP TABLE "competition_attempts"`);
    await queryRunner.query(`DROP TYPE "public"."competition_attempts_finalize_reason_enum"`);
    await queryRunner.query(`DROP TYPE "public"."competition_attempts_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."competition_attempts_kind_enum"`);
    await queryRunner.query(`DROP TABLE "competition_answers"`);
    await queryRunner.query(`DROP TYPE "public"."competition_answers_matched_via_enum"`);
    await queryRunner.query(`DROP TYPE "public"."competition_answers_mode_enum"`);
    await queryRunner.query(`DROP TABLE "stat_baselines"`);
    await queryRunner.query(`DROP INDEX "public"."questions_theme_id_idx"`);
    await queryRunner.query(`DROP TABLE "questions"`);
    await queryRunner.query(`DROP TABLE "themes"`);
    await queryRunner.query(`DROP TABLE "categories"`);
    await queryRunner.query(`DROP INDEX "public"."cards_updated_at_idx"`);
    await queryRunner.query(`DROP TABLE "cards"`);
    await queryRunner.query(`DROP TYPE "public"."cards_posted_on_enum"`);
    await queryRunner.query(`DROP TYPE "public"."cards_type_enum"`);
  }
}
