// Seeds the Supabase project of the loaded .env — dev unless NODE_ENV says otherwise.

import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { type Feed, transformFeeds } from "./feed-transform";

const DEFAULT_FEED_DIR = join(__dirname, "../../mobile/.feeds");
// Below this a Theme seeds fine but never reaches a Draw, so it is worth naming at seed time.
const MIN_QUESTIONS_PER_THEME = 10;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — see apps/api/.env.example`);
  }
  return value;
}

function readFeeds(dir: string): Feed[] {
  const files = readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    throw new Error(`No .json feed in ${dir}`);
  }
  return files.map((file) => JSON.parse(readFileSync(join(dir, file), "utf8")) as Feed);
}

async function main(): Promise<void> {
  const url = requireEnv("SUPABASE_URL");
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");
  const feedDir = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_FEED_DIR;

  const { themes, questions } = transformFeeds(readFeeds(feedDir));

  console.log(`Seeding ${new URL(url).host} from ${feedDir}`);
  for (const theme of themes) {
    const count = questions.filter((question) => question.theme_id === theme.id).length;
    const warning = count < MIN_QUESTIONS_PER_THEME ? " — below the Draw minimum" : "";
    console.log(`  ${theme.id}: ${count} questions${warning}`);
  }

  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

  // Themes first: every Question row carries a foreign key into them.
  const upserts: ReadonlyArray<[table: string, rows: Record<string, unknown>[]]> = [
    ["themes", themes],
    ["questions", questions],
  ];

  for (const [table, rows] of upserts) {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) {
      throw new Error(`Upsert into ${table} failed: ${error.message}`);
    }
    console.log(`Upserted ${rows.length} rows into ${table}`);
  }

  console.log("Seed complete.");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
