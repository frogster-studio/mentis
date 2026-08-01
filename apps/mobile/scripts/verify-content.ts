// Verifies the acceptance criteria of the content pipeline against the hosted
// project: anon SELECT works, anon writes are rejected, the RPC returns 10
// distinct questions all belonging to the requested Theme, seeded counts match
// feed.json, and `cards` is still there. Also proves the Account-era player
// tables (quiz_sessions, stat_baselines) block the anon key on both read and
// write — their RLS grants insert/select to the row owner only.
// Requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY and SUPABASE_SECRET_KEY in .env.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { type Feed, transformFeed } from "./transform";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — add it to the git-ignored .env file at the repo root`);
  }
  return value;
}

let failures = 0;

function check(label: string, ok: boolean, detail?: string): void {
  if (ok) {
    console.log(`✓ ${label}`);
  } else {
    failures += 1;
    console.error(`✗ ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main(): Promise<void> {
  const url = requireEnv("SUPABASE_URL");
  const anon = createClient(url, requireEnv("SUPABASE_PUBLISHABLE_KEY"), {
    auth: { persistSession: false },
  });
  const admin = createClient(url, requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { persistSession: false },
  });

  const feed = JSON.parse(readFileSync(new URL("../feed.json", import.meta.url), "utf8")) as Feed;
  const expected = transformFeed(feed);

  // A sample Theme and one of its Questions, derived from the feed.
  const sampleTheme = expected.themes[0];
  const sampleQuestion = expected.questions.find((q) => q.theme_id === sampleTheme.id);
  if (!sampleTheme || !sampleQuestion) {
    throw new Error("feed.json produced no themes or questions");
  }
  const themeQuestionIds = new Set(
    expected.questions.filter((q) => q.theme_id === sampleTheme.id).map((q) => q.id),
  );

  // Anon can SELECT everything.
  const themes = await anon.from("themes").select("id, name");
  check(
    `anon SELECT themes returns ${expected.themes.length} rows`,
    themes.data?.length === expected.themes.length,
    themes.error?.message ?? `got ${themes.data?.length}`,
  );

  const questionCount = await anon.from("questions").select("*", { count: "exact", head: true });
  check(
    `anon SELECT questions counts ${expected.questions.length} rows`,
    questionCount.count === expected.questions.length,
    questionCount.error?.message ?? `got ${questionCount.count}`,
  );

  // Every anon write is rejected (INSERT errors; UPDATE/DELETE affect 0 rows).
  const insert = await anon.from("themes").insert({ id: "zz-intrus", name: "Intrus" });
  check("anon INSERT is rejected", insert.error !== null);

  const update = await anon
    .from("questions")
    .update({ answer: "piraté" })
    .eq("id", sampleQuestion.id)
    .select();
  check("anon UPDATE affects no row", update.error !== null || update.data?.length === 0);

  const del = await anon.from("themes").delete().eq("id", sampleTheme.id).select();
  check("anon DELETE affects no row", del.error !== null || del.data?.length === 0);

  const intact = await anon.from("questions").select("answer").eq("id", sampleQuestion.id).single();
  check(
    `${sampleQuestion.id} is intact after the write attempts`,
    intact.data?.answer === sampleQuestion.answer,
  );

  // The RPC returns 10 distinct questions all belonging to the requested Theme.
  const rpc = await anon.rpc("get_random_questions", { theme_slug: sampleTheme.id });
  const rows: Array<{ id: string; theme_id: string; wrong_choices: string[] }> = rpc.data ?? [];
  const distinctIds = new Set(rows.map((row) => row.id));
  check(
    "RPC returns 10 distinct questions",
    rows.length === 10 && distinctIds.size === 10,
    rpc.error?.message ?? `got ${rows.length} rows, ${distinctIds.size} distinct`,
  );
  check(
    "RPC rows all belong to the requested theme",
    rows.length > 0 &&
      rows.every((row) => row.theme_id === sampleTheme.id && themeQuestionIds.has(row.id)),
  );
  check(
    "RPC rows each carry exactly 3 wrong choices",
    rows.length > 0 && rows.every((row) => row.wrong_choices.length === 3),
  );

  // Seeded content matches the transform output exactly (spot check + shape).
  const allQuestions = await admin
    .from("questions")
    .select("id, theme_id, text, answer, aliases, misspellings, wrong_choices")
    .order("id");
  const byId = new Map((allQuestions.data ?? []).map((row) => [row.id as string, row]));
  check(
    `${sampleQuestion.id} row matches the transform output exactly`,
    JSON.stringify(byId.get(sampleQuestion.id)) === JSON.stringify(sampleQuestion),
  );
  check(
    "every seeded question has exactly 3 wrong choices",
    (allQuestions.data ?? []).length > 0 &&
      (allQuestions.data ?? []).every((row) => (row.wrong_choices as string[]).length === 3),
    allQuestions.error?.message,
  );

  // Player tables (Account era): the anon key can neither read nor write either
  // one. Their RLS grants owner-only insert/select to the authenticated role, so
  // anon matches no policy — reads return no rows, writes are rejected. (The
  // authenticated owner-scoped path is exercised manually; scripting OAuth-only
  // sign-in is out of scope for this live check.)
  const intruderSession = {
    id: "11111111-1111-1111-1111-111111111111",
    owner: "00000000-0000-0000-0000-000000000000",
    theme_id: "zz-intrus",
    theme_name: "Intrus",
    points: 0,
    finished_at: "2026-01-01T00:00:00.000Z",
  };
  const intruderBaseline = {
    owner: "00000000-0000-0000-0000-000000000000",
    device: "22222222-2222-2222-2222-222222222222",
    theme_id: "zz-intrus",
    theme_name: "Intrus",
    total_points: 0,
    session_count: 0,
  };

  const sessionsRead = await anon.from("quiz_sessions").select("*");
  check(
    "anon cannot read quiz_sessions",
    sessionsRead.error !== null || sessionsRead.data?.length === 0,
    sessionsRead.error?.message ?? `got ${sessionsRead.data?.length} rows`,
  );

  const baselinesRead = await anon.from("stat_baselines").select("*");
  check(
    "anon cannot read stat_baselines",
    baselinesRead.error !== null || baselinesRead.data?.length === 0,
    baselinesRead.error?.message ?? `got ${baselinesRead.data?.length} rows`,
  );

  const sessionWrite = await anon.from("quiz_sessions").insert(intruderSession);
  check("anon INSERT into quiz_sessions is rejected", sessionWrite.error !== null);

  const baselineWrite = await anon.from("stat_baselines").insert(intruderBaseline);
  check("anon INSERT into stat_baselines is rejected", baselineWrite.error !== null);

  // The pre-existing cards table is still there.
  const cards = await admin.from("cards").select("*", { count: "exact", head: true });
  check("pre-existing cards table still exists", cards.error === null, cards.error?.message);

  if (failures > 0) {
    throw new Error(`${failures} check(s) failed`);
  }
  console.log("All checks passed.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
