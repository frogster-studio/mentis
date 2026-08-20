import { MigrationInterface, QueryRunner } from "typeorm";

export class InitIndexesDefaultsConstraints1787241785950 implements MigrationInterface {
  name = "InitIndexesDefaultsConstraints1787241785950";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "tags" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "payload" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "images" SET DEFAULT '[]'`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "created_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "updated_at" SET DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "posted_on" SET DEFAULT '{}'`);
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ALTER COLUMN "status" SET DEFAULT 'active'`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ALTER COLUMN "issued_at" SET DEFAULT now()`,
    );
    await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "aliases" SET DEFAULT '{}'`);
    await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "misspellings" SET DEFAULT '{}'`);
    await queryRunner.query(`CREATE INDEX "cards_updated_at_idx" ON "cards"  ("updated_at") `);
    await queryRunner.query(
      `CREATE INDEX "competition_attempts_day_idx" ON "competition_attempts"  ("day") `,
    );
    await queryRunner.query(
      `CREATE INDEX "competition_attempts_owner_day_idx" ON "competition_attempts"  ("owner", "day") `,
    );
    await queryRunner.query(
      `CREATE INDEX "quiz_sessions_owner_idx" ON "quiz_sessions"  ("owner") `,
    );
    await queryRunner.query(`CREATE INDEX "questions_theme_id_idx" ON "questions"  ("theme_id") `);
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "cards_posted_on_known_networks" CHECK (posted_on <@ array['x', 'linkedin', 'facebook', 'tiktok', 'youtube', 'instagram']::text[])`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "cards_title_not_blank" CHECK (length(trim(title)) > 0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cards" ADD CONSTRAINT "cards_type_known" CHECK (type in ('quiz', 'true-false', 'anecdote', 'did-you-know', 'riddle'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "competition_attempts_ten_questions" CHECK (cardinality(question_ids) = 10)`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "competition_attempts_finalize_reason_known" CHECK (finalize_reason in ('completed', 'quit', 'expired'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "competition_attempts_status_known" CHECK (status in ('active', 'finalized'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "competition_attempts_kind_known" CHECK (kind in ('initial', 'replay', 'catchup'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" ADD CONSTRAINT "competition_answers_matched_via_known" CHECK (matched_via in ('canonical', 'alias', 'misspelling', 'fuzzy', 'choice'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" ADD CONSTRAINT "competition_answers_mode_known" CHECK (mode in ('cash', 'square', 'none'))`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "questions_exactly_3_wrong_choices" CHECK (cardinality(wrong_choices) = 3)`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "competition_attempts_one_per_kind" UNIQUE ("owner", "day", "kind")`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ADD CONSTRAINT "FK_d583a3e338196b0d750f4aebf73" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" ADD CONSTRAINT "FK_e3ee1bffa7226995dbc1756b3df" FOREIGN KEY ("attempt_id") REFERENCES "competition_attempts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions" ADD CONSTRAINT "FK_2ea2bf9290e5526cf207c60c3a4" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" ADD CONSTRAINT "FK_e33a5129cc01279299076fc7c05" FOREIGN KEY ("theme_id") REFERENCES "themes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "stat_baselines" ADD CONSTRAINT "FK_c35d9043c1439d70c92195ecd31" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "stat_baselines" DROP CONSTRAINT "FK_c35d9043c1439d70c92195ecd31"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "FK_e33a5129cc01279299076fc7c05"`,
    );
    await queryRunner.query(
      `ALTER TABLE "quiz_sessions" DROP CONSTRAINT "FK_2ea2bf9290e5526cf207c60c3a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" DROP CONSTRAINT "FK_e3ee1bffa7226995dbc1756b3df"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "FK_d583a3e338196b0d750f4aebf73"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "competition_attempts_one_per_kind"`,
    );
    await queryRunner.query(
      `ALTER TABLE "questions" DROP CONSTRAINT "questions_exactly_3_wrong_choices"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" DROP CONSTRAINT "competition_answers_mode_known"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_answers" DROP CONSTRAINT "competition_answers_matched_via_known"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "competition_attempts_kind_known"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "competition_attempts_status_known"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "competition_attempts_finalize_reason_known"`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" DROP CONSTRAINT "competition_attempts_ten_questions"`,
    );
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "cards_type_known"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "cards_title_not_blank"`);
    await queryRunner.query(`ALTER TABLE "cards" DROP CONSTRAINT "cards_posted_on_known_networks"`);
    await queryRunner.query(`DROP INDEX "public"."questions_theme_id_idx"`);
    await queryRunner.query(`DROP INDEX "public"."quiz_sessions_owner_idx"`);
    await queryRunner.query(`DROP INDEX "public"."competition_attempts_owner_day_idx"`);
    await queryRunner.query(`DROP INDEX "public"."competition_attempts_day_idx"`);
    await queryRunner.query(`DROP INDEX "public"."cards_updated_at_idx"`);
    await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "misspellings" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "questions" ALTER COLUMN "aliases" DROP DEFAULT`);
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ALTER COLUMN "issued_at" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "competition_attempts" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "posted_on" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "updated_at" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "created_at" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "images" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "payload" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "cards" ALTER COLUMN "tags" DROP DEFAULT`);
  }
}
