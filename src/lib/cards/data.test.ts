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
import { CARD_IMAGES_BUCKET } from "@/lib/images/storage";

// PostgREST ILIKE semantics: % and _ are wildcards, backslash escapes them,
// matching is case-insensitive.
function ilikeToRegExp(pattern: string): RegExp {
  const escapeForRegExp = (char: string) =>
    char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let source = "";
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (char === "\\" && i + 1 < pattern.length) {
      i += 1;
      source += escapeForRegExp(pattern[i]);
    } else if (char === "%") {
      source += ".*";
    } else if (char === "_") {
      source += ".";
    } else {
      source += escapeForRegExp(char);
    }
  }
  return new RegExp(`^${source}$`, "is");
}

// In-memory double of the slice of the Supabase client the data layer uses:
// insert().select().single(), update().eq().select().single(),
// delete().eq().select(), storage.from(bucket).remove(paths), and a read query
// builder — select() chaining ilike/eq/contains, then order().range() awaited
// as a thenable (like the real client) or terminated with maybeSingle().
function createFakeSupabase(options?: {
  insertError?: string;
  updateError?: string;
  removeError?: string;
  removals?: { bucket: string; paths: string[] }[];
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

  function createReadQuery() {
    type Row = Record<string, unknown>;
    const filters: ((row: Row) => boolean)[] = [];
    let ordering: { column: string; ascending: boolean } | null = null;
    let bounds: { from: number; to: number } | null = null;

    const matching = () => rows.filter((row) => filters.every((f) => f(row)));

    const builder = {
      ilike(column: string, pattern: string) {
        const regex = ilikeToRegExp(pattern);
        filters.push((row) => regex.test(String(row[column])));
        return builder;
      },
      eq(column: string, value: unknown) {
        filters.push((row) => row[column] === value);
        return builder;
      },
      contains(column: string, values: unknown[]) {
        filters.push((row) =>
          values.every((value) => (row[column] as unknown[]).includes(value)),
        );
        return builder;
      },
      order(column: string, opts: { ascending: boolean }) {
        ordering = { column, ascending: opts.ascending };
        return builder;
      },
      range(from: number, to: number) {
        bounds = { from, to };
        return builder;
      },
      async maybeSingle() {
        return { data: matching()[0] ?? null, error: null };
      },
      // Awaiting the builder runs the query, like the real thenable client.
      // biome-ignore lint/suspicious/noThenProperty: the real Supabase query builder is a thenable; the fake must be too.
      then(
        resolve: (result: { data: Row[]; count: number; error: null }) => void,
      ) {
        let subset = matching();
        if (ordering) {
          subset = sortRows(subset, ordering.column, ordering.ascending);
        }
        const count = subset.length;
        if (bounds) {
          subset = subset.slice(bounds.from, bounds.to + 1);
        }
        resolve({ data: subset, count, error: null });
      },
    };
    return builder;
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
        select(_columns: string, _opts?: { count?: string }) {
          return createReadQuery();
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
            eq(column: string, value: unknown) {
              // The real client deletes on await and, with select(), returns
              // the removed rows; mirror that inside the thenable.
              const runDelete = () => {
                const index = rows.findIndex((r) => r[column] === value);
                return index >= 0 ? rows.splice(index, 1) : [];
              };
              return {
                select(_columns?: string) {
                  return {
                    // biome-ignore lint/suspicious/noThenProperty: the real Supabase query builder is a thenable; the fake must be too.
                    then(
                      resolve: (result: {
                        data: Record<string, unknown>[];
                        error: null;
                      }) => void,
                    ) {
                      resolve({ data: runDelete(), error: null });
                    },
                  };
                },
              };
            },
          };
        },
      };
    },
    storage: {
      from(bucket: string) {
        return {
          async remove(paths: string[]) {
            if (options?.removeError) {
              return { data: null, error: { message: options.removeError } };
            }
            options?.removals?.push({ bucket, paths });
            return { data: [], error: null };
          },
        };
      },
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
    const { cards, totalCount, page, pageCount } = await listCards(client);

    expect(cards).toEqual([created]);
    expect({ totalCount, page, pageCount }).toEqual({
      totalCount: 1,
      page: 1,
      pageCount: 1,
    });
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

    const { cards } = await listCards(client);
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

    const { cards } = await listCards(client, { tag: "histoire" });
    expect(cards.map((card) => card.title)).toEqual(["Tagged"]);
  });

  it("normalizes the filter Tag before matching", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Tagged", "a", ["histoire"]));

    const { cards } = await listCards(client, { tag: "  Histoire " });
    expect(cards.map((card) => card.title)).toEqual(["Tagged"]);
  });

  it("returns every Card when the Tag is blank", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("One", "a", ["histoire"]));
    await insertCard(client, anecdote("Two", "b"));

    expect((await listCards(client, { tag: "   " })).cards).toHaveLength(2);
  });
});

describe("listCards with a Title search", () => {
  it("matches partial Titles case-insensitively", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Mendès France", "a"));
    await insertCard(client, anecdote("La prise de la Bastille", "b"));

    const { cards } = await listCards(client, { search: "bastille" });
    expect(cards.map((card) => card.title)).toEqual([
      "La prise de la Bastille",
    ]);
  });

  it("treats LIKE wildcards in the term as literal characters", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("100% coton", "a"));
    await insertCard(client, anecdote("100x coton", "b"));

    const { cards } = await listCards(client, { search: "100%" });
    expect(cards.map((card) => card.title)).toEqual(["100% coton"]);
  });

  it("ignores a blank search", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Seule", "a"));

    expect((await listCards(client, { search: "   " })).cards).toHaveLength(1);
  });
});

describe("listCards with Type and Status filters", () => {
  it("narrows by Card Type", async () => {
    const client = createFakeSupabase();

    await insertCard(client, anecdote("Anecdote", "a"));
    await insertCard(client, quiz("Quiz", quizPayload(0, "Voilà.")));

    const { cards } = await listCards(client, { type: "quiz" });
    expect(cards.map((card) => card.title)).toEqual(["Quiz"]);
  });

  it("narrows by Status", async () => {
    const client = createFakeSupabase();

    const draft = await insertCard(client, anecdote("Brouillon", "a"));
    await updateCard(client, draft.id, { ...draft, status: "published" });
    await insertCard(client, anecdote("Encore en cours", "b"));

    const { cards } = await listCards(client, { status: "published" });
    expect(cards.map((card) => card.title)).toEqual(["Brouillon"]);
  });

  it("composes search, Type, Status, and Tag filters", async () => {
    const client = createFakeSupabase();

    const match = await insertCard(
      client,
      anecdote("Bastille en fête", "a", ["histoire"]),
    );
    await updateCard(client, match.id, { ...match, status: "published" });
    // Each of these misses exactly one criterion.
    await insertCard(client, anecdote("Bastille oubliée", "b", ["histoire"]));
    const wrongTag = await insertCard(
      client,
      anecdote("Bastille ailleurs", "c", ["géo"]),
    );
    await updateCard(client, wrongTag.id, { ...wrongTag, status: "published" });
    const wrongTitle = await insertCard(
      client,
      anecdote("Autre sujet", "d", ["histoire"]),
    );
    await updateCard(client, wrongTitle.id, {
      ...wrongTitle,
      status: "published",
    });

    const { cards, totalCount } = await listCards(client, {
      search: "bastille",
      type: "anecdote",
      status: "published",
      tag: "histoire",
    });
    expect(cards.map((card) => card.title)).toEqual(["Bastille en fête"]);
    expect(totalCount).toBe(1);
  });
});

describe("listCards pagination", () => {
  async function seedCards(client: SupabaseClient, count: number) {
    for (let i = 1; i <= count; i += 1) {
      await insertCard(client, anecdote(`Card ${i}`, "corps"));
    }
  }

  it("slices pages server-side, newest first, and reports the totals", async () => {
    const client = createFakeSupabase();
    await seedCards(client, 5);

    const firstPage = await listCards(client, { page: 1, pageSize: 2 });
    expect(firstPage.cards.map((card) => card.title)).toEqual([
      "Card 5",
      "Card 4",
    ]);
    expect(firstPage).toMatchObject({ totalCount: 5, page: 1, pageCount: 3 });

    const lastPage = await listCards(client, { page: 3, pageSize: 2 });
    expect(lastPage.cards.map((card) => card.title)).toEqual(["Card 1"]);
  });

  it("keeps the page count in step with active filters", async () => {
    const client = createFakeSupabase();
    await seedCards(client, 3);
    await insertCard(client, quiz("Quiz", quizPayload(0, "Voilà.")));

    const { totalCount, pageCount } = await listCards(client, {
      type: "anecdote",
      page: 1,
      pageSize: 2,
    });
    expect(totalCount).toBe(3);
    expect(pageCount).toBe(2);
  });

  it("returns an empty page beyond the last without losing the totals", async () => {
    const client = createFakeSupabase();
    await seedCards(client, 3);

    const beyond = await listCards(client, { page: 9, pageSize: 2 });
    expect(beyond.cards).toEqual([]);
    expect(beyond).toMatchObject({ totalCount: 3, page: 9, pageCount: 2 });
  });

  it("clamps a page below 1 to the first page", async () => {
    const client = createFakeSupabase();
    await seedCards(client, 2);

    const { cards, page } = await listCards(client, { page: 0, pageSize: 2 });
    expect(page).toBe(1);
    expect(cards).toHaveLength(2);
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

    const { cards } = await listCards(client);
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
    const { cards } = await listCards(client);

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

describe("Card Type change", () => {
  it("preserves shared fields and replaces the payload", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      cardSchema.parse({
        type: "quiz",
        title: "Bastille",
        tags: ["histoire", "révolution"],
        status: "published",
        payload: quizPayload(0, "Le 14 juillet 1789."),
      }),
    );

    // Mirrors a save after a confirmed type change: shared fields carried
    // over unchanged, the payload rebuilt from the new type's fields.
    const newPayload = {
      clues: "Prise le 14 juillet 1789.",
      answer: "La Bastille",
    };
    const updated = await updateCard(
      client,
      created.id,
      cardSchema.parse({
        type: "riddle",
        title: created.title,
        tags: created.tags,
        status: created.status,
        images: created.images,
        payload: newPayload,
      }),
    );

    expect(updated).toMatchObject({
      id: created.id,
      type: "riddle",
      title: created.title,
      tags: created.tags,
      status: created.status,
      images: created.images,
    });
    expect(updated.payload).toEqual(newPayload);
    // The saved Card validates against the new type's schema and reloads
    // intact (getCard re-parses the row through cardSchema).
    expect(cardSchema.safeParse(updated).success).toBe(true);
    expect(await getCard(client, created.id)).toEqual(updated);
  });
});

function anecdoteWithImages(
  title: string,
  images: { path: string; order: number; caption?: string }[],
) {
  return cardSchema.parse({
    type: "anecdote",
    title,
    images,
    payload: { body: "corps" },
  });
}

describe("Card Images", () => {
  const threeImages = [
    { path: "a.webp", order: 0, caption: "Première" },
    { path: "b.webp", order: 1 },
    { path: "c.webp", order: 2, caption: "Dernière" },
  ];

  it("round-trips the Image list order through a reorder", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      anecdoteWithImages("Illustrée", threeImages),
    );
    expect(created.images.map((image) => image.path)).toEqual([
      "a.webp",
      "b.webp",
      "c.webp",
    ]);

    // Mirrors a save after moving the last Image first: order reassigned
    // by display index, Captions travelling with their Image.
    const reordered = await updateCard(client, created.id, {
      ...created,
      images: [
        { path: "c.webp", order: 0, caption: "Dernière" },
        { path: "a.webp", order: 1, caption: "Première" },
        { path: "b.webp", order: 2 },
      ],
    });

    const reloaded = await getCard(client, created.id);
    expect(reloaded).toEqual(reordered);
    expect(reloaded?.images.map((image) => image.path)).toEqual([
      "c.webp",
      "a.webp",
      "b.webp",
    ]);
    expect(reloaded?.images[0].caption).toBe("Dernière");
  });

  it("persists Caption edits and absent Captions alike", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      anecdoteWithImages("Légendée", threeImages),
    );
    expect(created.images.map((image) => image.caption)).toEqual([
      "Première",
      undefined,
      "Dernière",
    ]);

    await updateCard(client, created.id, {
      ...created,
      images: [
        { path: "a.webp", order: 0, caption: "Première (retouchée)" },
        { path: "b.webp", order: 1, caption: "Nouvelle" },
        { path: "c.webp", order: 2 },
      ],
    });

    const reloaded = await getCard(client, created.id);
    expect(reloaded?.images.map((image) => image.caption)).toEqual([
      "Première (retouchée)",
      "Nouvelle",
      undefined,
    ]);
  });

  it("keeps order and Captions through an unrelated edit", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      anecdoteWithImages("Avant", threeImages),
    );

    await updateCard(client, created.id, { ...created, title: "Après" });

    const reloaded = await getCard(client, created.id);
    expect(reloaded?.title).toBe("Après");
    expect(reloaded?.images).toEqual(created.images);
  });

  it("round-trips removing an Image from the Card", async () => {
    const client = createFakeSupabase();

    const created = await insertCard(
      client,
      anecdoteWithImages("Allégée", threeImages),
    );

    await updateCard(client, created.id, {
      ...created,
      images: [
        { path: "a.webp", order: 0, caption: "Première" },
        { path: "c.webp", order: 1, caption: "Dernière" },
      ],
    });

    const reloaded = await getCard(client, created.id);
    expect(reloaded?.images.map((image) => image.path)).toEqual([
      "a.webp",
      "c.webp",
    ]);
  });
});

describe("deleteCard", () => {
  const withImages = [
    { path: "a.webp", order: 0, caption: "Première" },
    { path: "b.webp", order: 1 },
  ];

  it("hard-deletes a Card without Images and leaves the others alone", async () => {
    const removals: { bucket: string; paths: string[] }[] = [];
    const client = createFakeSupabase({ removals });

    const doomed = await insertCard(client, anecdote("Doomed", "a"));
    const kept = await insertCard(client, anecdote("Kept", "b"));

    await deleteCard(client, doomed.id);

    expect(await getCard(client, doomed.id)).toBeNull();
    expect((await listCards(client)).cards).toEqual([kept]);
    // A Card without Images makes no storage request.
    expect(removals).toEqual([]);
  });

  it("removes the row and requests deletion of every referenced object", async () => {
    const removals: { bucket: string; paths: string[] }[] = [];
    const client = createFakeSupabase({ removals });

    const doomed = await insertCard(
      client,
      anecdoteWithImages("Illustrée", withImages),
    );

    await deleteCard(client, doomed.id);

    expect(await getCard(client, doomed.id)).toBeNull();
    expect(removals).toEqual([
      { bucket: CARD_IMAGES_BUCKET, paths: ["a.webp", "b.webp"] },
    ]);
  });

  it("keeps the row deleted when storage cleanup fails, surfacing the error", async () => {
    const client = createFakeSupabase({ removeError: "boom" });

    const doomed = await insertCard(
      client,
      anecdoteWithImages("Illustrée", withImages),
    );

    await expect(deleteCard(client, doomed.id)).rejects.toThrow(
      "Failed to remove Card Images: boom",
    );
    // The row deletion stands; the failure never resurrects the Card.
    expect(await getCard(client, doomed.id)).toBeNull();
  });
});
