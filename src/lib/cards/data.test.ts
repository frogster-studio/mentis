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
// insert().select().single(), select().order(), select().contains().order(),
// select().eq().maybeSingle(), update().eq().select().single() and
// delete().eq().
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

  function sortRows(
    subset: Record<string, unknown>[],
    column: string,
    ascending: boolean,
  ) {
    return [...subset].sort((a, b) => {
      const comparison = String(a[column]).localeCompare(String(b[column]));
      return ascending ? comparison : -comparison;
    });
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
              return {
                data: sortRows(rows, column, opts.ascending),
                error: null,
              };
            },
            contains(column: string, values: unknown[]) {
              const matching = rows.filter((row) =>
                values.every((value) =>
                  (row[column] as unknown[]).includes(value),
                ),
              );
              return {
                async order(orderColumn: string, opts: { ascending: boolean }) {
                  return {
                    data: sortRows(matching, orderColumn, opts.ascending),
                    error: null,
                  };
                },
              };
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

function anecdote(title: string, body: string, tags: string[] = []) {
  return cardSchema.parse({ type: "anecdote", title, tags, payload: { body } });
}

function quizPayload(correctIndex: number, explanation: string) {
  return {
    question: "En quelle année la Bastille a-t-elle été prise ?",
    choices: ["1789", "1792", "1848", "1815"].map((text, index) => ({
      text,
      correct: index === correctIndex,
    })),
    explanation,
  };
}

function quiz(title: string, payload: ReturnType<typeof quizPayload>) {
  return cardSchema.parse({ type: "quiz", title, payload });
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

describe("listCards with a Tag filter", () => {
  it("returns only the Cards carrying the Tag", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Tagged", "a", ["histoire"]));
    await insertCard(client, anecdote("Other Tag", "b", ["géo"]));
    await insertCard(client, anecdote("Untagged", "c"));

    const cards = await listCards(client, { tag: "histoire" });
    expect(cards.map((card) => card.title)).toEqual(["Tagged"]);
  });

  it("normalizes the filter Tag before matching", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Tagged", "a", ["histoire"]));

    const cards = await listCards(client, { tag: "  Histoire " });
    expect(cards.map((card) => card.title)).toEqual(["Tagged"]);
  });

  it("returns every Card when the Tag is blank", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("One", "a", ["histoire"]));
    await insertCard(client, anecdote("Two", "b"));

    expect(await listCards(client, { tag: "   " })).toHaveLength(2);
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
    const updated = await updateCard(
      client,
      created.id,
      anecdote("Après", "nouveau"),
    );

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

describe("Quiz Cards", () => {
  it("round-trips a Quiz create through the list", async () => {
    const client = createFakeSupabase();
    const payload = quizPayload(0, "Le 14 juillet 1789.");

    const created = await insertCard(client, quiz("Bastille", payload));
    const cards = await listCards(client);

    expect(cards).toEqual([created]);
    expect(cards[0]).toMatchObject({
      type: "quiz",
      title: "Bastille",
      status: "draft",
      payload,
    });
  });

  it("round-trips a Quiz update with a changed correct Choice", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      quiz("Bastille", quizPayload(1, "À corriger.")),
    );
    const newPayload = quizPayload(0, "Le 14 juillet 1789.");

    const updated = await updateCard(
      client,
      created.id,
      quiz("Bastille", newPayload),
    );

    expect(updated.payload).toEqual(newPayload);
    expect(updated.updatedAt > created.updatedAt).toBe(true);
    expect(await getCard(client, created.id)).toEqual(updated);
  });
});

function trueFalse(title: string, answer: boolean, explanation: string) {
  return cardSchema.parse({
    type: "true-false",
    title,
    payload: {
      assertion: "Clovis a brisé lui-même le vase de Soissons.",
      answer,
      explanation,
    },
  });
}

function riddle(title: string, payload: Record<string, string>) {
  return cardSchema.parse({ type: "riddle", title, payload });
}

describe("True/False Cards", () => {
  it("round-trips a create and an update with a flipped answer", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(client, trueFalse("Vase", true, "Si."));
    expect(created).toMatchObject({
      type: "true-false",
      payload: { answer: true, explanation: "Si." },
    });

    const updated = await updateCard(
      client,
      created.id,
      trueFalse("Vase", false, "C'est un soldat qui l'a brisé."),
    );

    expect(updated.payload).toMatchObject({
      answer: false,
      explanation: "C'est un soldat qui l'a brisé.",
    });
    expect(await getCard(client, created.id)).toEqual(updated);
  });
});

describe("Riddle Cards", () => {
  it("round-trips a create with Bonus Info and an update dropping it", async () => {
    const client = createFakeSupabase();
    const payload = {
      clues: "Le matin à quatre pattes.",
      answer: "L'homme",
      bonusInfo: "Œdipe l'a résolue.",
    };

    const created = await insertCard(client, riddle("Sphinx", payload));
    expect(created.payload).toEqual(payload);

    const { bonusInfo: _bonusInfo, ...withoutBonus } = payload;
    const updated = await updateCard(
      client,
      created.id,
      riddle("Sphinx", withoutBonus),
    );

    expect(updated.payload).toEqual(withoutBonus);
    expect(await getCard(client, created.id)).toEqual(updated);
  });
});

function didYouKnow(title: string, body: string) {
  return cardSchema.parse({ type: "did-you-know", title, payload: { body } });
}

describe("Did You Know Cards", () => {
  it("round-trips a create and update under its own type value", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      didYouKnow("Tour Eiffel", "Elle grandit de 15 cm l'été."),
    );
    expect(created.type).toBe("did-you-know");

    const updated = await updateCard(
      client,
      created.id,
      didYouKnow(
        "Tour Eiffel",
        "La dilatation la fait grandir de 15 cm l'été.",
      ),
    );

    expect(updated.type).toBe("did-you-know");
    expect(updated.payload).toEqual({
      body: "La dilatation la fait grandir de 15 cm l'été.",
    });
    expect(await getCard(client, created.id)).toEqual(updated);
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
