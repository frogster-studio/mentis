import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { insertCard, listCards } from "@/lib/cards/data";
import { cardSchema } from "@/lib/cards/schema";

// In-memory double of the slice of the Supabase client the data layer uses:
// insert().select().single() and select().order().
function createFakeSupabase(options?: { insertError?: string }) {
  const rows: Record<string, unknown>[] = [];
  let tick = 0;

  const client = {
    from(table: string) {
      if (table !== "cards") {
        throw new Error(`Unexpected table: ${table}`);
      }
      return {
        insert(values: Record<string, unknown>) {
          return {
            select() {
              return {
                async single() {
                  if (options?.insertError) {
                    return {
                      data: null,
                      error: { message: options.insertError },
                    };
                  }
                  tick += 1;
                  const timestamp = new Date(
                    Date.UTC(2026, 6, 8, 12, 0, tick),
                  ).toISOString();
                  const row = {
                    id: `00000000-0000-0000-0000-00000000000${tick}`,
                    created_at: timestamp,
                    updated_at: timestamp,
                    ...values,
                  };
                  rows.push(row);
                  return { data: row, error: null };
                },
              };
            },
          };
        },
        select(_columns: string) {
          return {
            async order(column: string, opts: { ascending: boolean }) {
              const sorted = [...rows].sort((a, b) => {
                const left = String(a[column]);
                const right = String(b[column]);
                const comparison = left.localeCompare(right);
                return opts.ascending ? comparison : -comparison;
              });
              return { data: sorted, error: null };
            },
          };
        },
      };
    },
  };

  return client as unknown as SupabaseClient;
}

function anecdote(title: string, body: string) {
  return cardSchema.parse({ type: "anecdote", title, payload: { body } });
}

describe("insertCard and listCards", () => {
  it("round-trips a created Anecdote through the list", async () => {
    const client = createFakeSupabase();
    const body = "Ligne un.\nLigne deux.";

    const created = await insertCard(client, anecdote("Mendès France", body));
    const cards = await listCards(client);

    expect(cards).toEqual([created]);
    expect(cards[0]).toMatchObject({
      type: "anecdote",
      title: "Mendès France",
      status: "draft",
      tags: [],
      images: [],
      payload: { body },
    });
    expect(cards[0].id).not.toBe("");
    expect(cards[0].createdAt).toBe(cards[0].updatedAt);
  });

  it("lists Cards sorted by last update descending", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("First", "a"));
    await insertCard(client, anecdote("Second", "b"));

    const cards = await listCards(client);
    expect(cards.map((card) => card.title)).toEqual(["Second", "First"]);
  });

  it("surfaces an insert failure as an error", async () => {
    const client = createFakeSupabase({ insertError: "boom" });

    await expect(insertCard(client, anecdote("Doomed", "x"))).rejects.toThrow(
      "Failed to create Card: boom",
    );
  });
});
