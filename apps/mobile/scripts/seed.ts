// Seeds the linked hosted Supabase project from feed.json (idempotent upserts).
// Requires SUPABASE_URL and SUPABASE_SECRET_KEY in the git-ignored .env file.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "./env";
import { type Feed, transformFeed } from "./transform";

async function main(): Promise<void> {
  const url = requireEnv("SUPABASE_URL");
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");

  const feed = JSON.parse(readFileSync(new URL("../feed.json", import.meta.url), "utf8")) as Feed;
  const { themes, questions } = transformFeed(feed);

  const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

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
