import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import {
  deleteCard,
  getCard,
  insertCard,
  listCards,
  updateCard,
} from "@/lib/cards/data";
import { cardSchema } from "@/lib/cards/schema";

// In-memory double of the slice of the Supabase client the data layer uses:
// insert().select().single(), select().order(), select().eq().maybeSingle(),
// update().eq().select().single() and delete().eq().
function createFakeSupabase(options?: {
  insertError?: string;
  updateError?: string;
}) {
  const rows: Record<string, unknown>[] = [];
  let tick = 0;

  // Mimics the cards_set_updated_at trigger: every write gets a later stamp.
  function nextTimestamp() {
    tick += 1;
    return new Date(Date.UTC(2026, 6, 8, 12, 0, tick)).toISOString();
  }

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
                  const timestamp = nextTimestamp();
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
            eq(column: string, value: unknown) {
              return {
                async maybeSingle() {
                  const row = rows.find((r) => r[column] === value) ?? null;
                  return { data: row, error: null };
                },
              };
            },
          };
        },
        update(values: Record<string, unknown>) {
          return {
            eq(column: string, value: unknown) {
              return {
                select() {
                  return {
                    async single() {
                      if (options?.updateError) {
                        return {
                          data: null,
                          error: { message: options.updateError },
                        };
                      }
                      const row = rows.find((r) => r[column] === value);
                      if (!row) {
                        return { data: null, error: { message: "not found" } };
                      }
                      Object.assign(row, values, {
                        updated_at: nextTimestamp(),
                      });
                      return { data: row, error: null };
                    },
                  };
                },
              };
            },
          };
        },
        delete() {
          return {
            async eq(column: string, value: unknown) {
              const index = rows.findIndex((r) => r[column] === value);
              if (index >= 0) {
                rows.splice(index, 1);
              }
              return { error: null };
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

describe("getCard", () => {
  it("loads a Card by id and returns null for an unknown id", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(client, anecdote("Lookup", "corps"));

    expect(await getCard(client, created.id)).toEqual(created);
    expect(
      await getCard(client, "ffffffff-ffff-ffff-ffff-ffffffffffff"),
    ).toBeNull();
  });
});

describe("updateCard", () => {
  it("round-trips an edit and bumps the updated timestamp", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(client, anecdote("Avant", "ancien"));
    const updated = await updateCard(client, created.id, {
      ...created,
      title: "Après",
      payload: { body: "nouveau" },
    });

    expect(updated).toMatchObject({
      id: created.id,
      title: "Après",
      payload: { body: "nouveau" },
    });
    expect(updated.createdAt).toBe(created.createdAt);
    expect(updated.updatedAt > created.updatedAt).toBe(true);
    expect(await getCard(client, created.id)).toEqual(updated);
  });

  it("persists a status change", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(client, anecdote("Statut", "corps"));
    expect(created.status).toBe("draft");

    await updateCard(client, created.id, { ...created, status: "published" });

    const reloaded = await getCard(client, created.id);
    expect(reloaded?.status).toBe("published");
  });

  it("re-sorts the list after an update", async () => {
    const client = createFakeSupabase();

    const first = await insertCard(client, anecdote("First", "a"));
    await insertCard(client, anecdote("Second", "b"));

    await updateCard(client, first.id, { ...first, title: "First edited" });

    const cards = await listCards(client);
    expect(cards.map((card) => card.title)).toEqual(["First edited", "Second"]);
  });

  it("surfaces an update failure as an error", async () => {
    const client = createFakeSupabase({ updateError: "boom" });

    const card = anecdote("Doomed", "x");
    await expect(
      updateCard(client, "00000000-0000-0000-0000-000000000001", card),
    ).rejects.toThrow("Failed to update Card: boom");
  });
});

describe("deleteCard", () => {
  it("hard-deletes a Card and leaves the others alone", async () => {
    const client = createFakeSupabase();

    const doomed = await insertCard(client, anecdote("Doomed", "a"));
    const kept = await insertCard(client, anecdote("Kept", "b"));

    await deleteCard(client, doomed.id);

    expect(await getCard(client, doomed.id)).toBeNull();
    expect(await listCards(client)).toEqual([kept]);
  });
});
