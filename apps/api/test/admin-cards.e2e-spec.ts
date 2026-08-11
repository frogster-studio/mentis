import { randomUUID } from "node:crypto";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import {
  createLocalJWKSet,
  exportJWK,
  type GenerateKeyPairResult,
  generateKeyPair,
  type JWTPayload,
  SignJWT,
} from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { CARD_LIST_PAGE_SIZE } from "../src/admin/cards.controller";
import { JWKS } from "../src/auth/jwks";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";
import { SUPABASE } from "../src/supabase";
import { testEnv } from "./test-env";

type CardImage = { path: string; order: number; caption?: string };

type CardRow = {
  id: string;
  type: string;
  title: string;
  tags: string[];
  payload: unknown;
  images: CardImage[];
  posted_on: string[];
  created_at: string;
  updated_at: string;
};

type Removal = { bucket: string; paths: string[]; storedIds: string[] };

let signingKey: GenerateKeyPairResult;

const mint = (claims: JWTPayload): Promise<string> =>
  new SignJWT({
    iss: `${testEnv.SUPABASE_URL}/auth/v1`,
    aud: "authenticated",
    sub: randomUUID(),
    role: "authenticated",
    ...claims,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(signingKey.privateKey);

let cardRows: CardRow[] = [];
let removals: Removal[] = [];
let signedPaths: string[] = [];
let removeFails = false;
let tick = 0;

const nextTimestamp = (): string => {
  tick += 1;
  return new Date(Date.UTC(2026, 7, 11, 12, 0, tick)).toISOString();
};

// PostgREST ILIKE semantics: % and _ are wildcards, a backslash escapes them, matching is case-insensitive.
const ilikeToRegExp = (pattern: string): RegExp => {
  const escapeForRegExp = (char: string) => char.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  let source = "";
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index];
    if (char === "\\" && index + 1 < pattern.length) {
      index += 1;
      source += escapeForRegExp(pattern[index]);
    } else if (char === "%") {
      source += ".*";
    } else if (char === "_") {
      source += ".";
    } else {
      source += escapeForRegExp(char);
    }
  }
  return new RegExp(`^${source}$`, "is");
};

// Stands in for PostgREST: the aliased camelCase select strings are proven by the live smoke, not here.
const project = (row: CardRow, columns: string) =>
  columns === "images"
    ? { images: row.images }
    : {
        id: row.id,
        type: row.type,
        title: row.title,
        tags: row.tags,
        payload: row.payload,
        images: row.images,
        postedOn: row.posted_on,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

const CONTENT_COLUMNS = ["type", "title", "tags", "payload", "images"] as const;

// Mirrors the cards_set_updated_at trigger: only a content change moves the stamp.
const applyUpdate = (row: CardRow, values: Record<string, unknown>) => {
  const contentChanged = CONTENT_COLUMNS.some(
    (column) => column in values && JSON.stringify(values[column]) !== JSON.stringify(row[column]),
  );
  Object.assign(row, values, contentChanged ? { updated_at: nextTimestamp() } : {});
  return row;
};

const createSelectQuery = (columns: string) => {
  const filters: ((row: CardRow) => boolean)[] = [];
  let ordering: { column: string; ascending: boolean } | null = null;
  let bounds: { from: number; to: number } | null = null;
  const matching = () => cardRows.filter((row) => filters.every((filter) => filter(row)));

  const builder = {
    ilike(column: string, pattern: string) {
      const regex = ilikeToRegExp(pattern);
      filters.push((row) => regex.test(String(row[column as keyof CardRow])));
      return builder;
    },
    eq(column: string, value: unknown) {
      filters.push((row) => row[column as keyof CardRow] === value);
      return builder;
    },
    contains(column: string, values: unknown[]) {
      filters.push((row) =>
        values.every((value) => (row[column as keyof CardRow] as unknown[]).includes(value)),
      );
      return builder;
    },
    order(column: string, options: { ascending: boolean }) {
      ordering = { column, ascending: options.ascending };
      return builder;
    },
    range(from: number, to: number) {
      bounds = { from, to };
      return builder;
    },
    maybeSingle() {
      const row = matching()[0];
      return Promise.resolve({
        data: row === undefined ? null : project(row, columns),
        error: null,
      });
    },
    // biome-ignore lint/suspicious/noThenProperty: the real Supabase query builder is a thenable; the fake must be too.
    then(resolve: (result: { data: unknown[]; count: number; error: null }) => void) {
      let subset = matching();
      if (ordering !== null) {
        const { column, ascending } = ordering;
        const direction = ascending ? 1 : -1;
        subset = [...subset].sort(
          (left, right) =>
            direction *
            String(left[column as keyof CardRow]).localeCompare(
              String(right[column as keyof CardRow]),
            ),
        );
      }
      const count = subset.length;
      if (bounds !== null) {
        subset = subset.slice(bounds.from, bounds.to + 1);
      }
      resolve({ data: subset.map((row) => project(row, columns)), count, error: null });
    },
  };
  return builder;
};

const stubSupabase = {
  from: (table: string) => {
    if (table !== "cards") {
      throw new Error(`unexpected table ${table}`);
    }
    return {
      select: (columns: string, _options?: { count?: string }) => createSelectQuery(columns),
      insert: (values: Record<string, unknown>) => ({
        select: (columns: string) => ({
          single: () => {
            const timestamp = nextTimestamp();
            const row: CardRow = {
              id: randomUUID(),
              type: String(values.type),
              title: String(values.title),
              tags: values.tags as string[],
              payload: values.payload,
              images: values.images as CardImage[],
              posted_on: [],
              created_at: timestamp,
              updated_at: timestamp,
            };
            cardRows.push(row);
            return Promise.resolve({ data: project(row, columns), error: null });
          },
        }),
      }),
      update: (values: Record<string, unknown>) => ({
        eq: (column: string, value: unknown) => ({
          select: (columns: string) => ({
            maybeSingle: () => {
              const row = cardRows.find((stored) => stored[column as keyof CardRow] === value);
              return Promise.resolve({
                data: row === undefined ? null : project(applyUpdate(row, values), columns),
                error: null,
              });
            },
          }),
        }),
      }),
      delete: () => ({
        eq: (column: string, value: unknown) => ({
          select: (columns: string) => ({
            // biome-ignore lint/suspicious/noThenProperty: the real Supabase query builder is a thenable; the fake must be too.
            then(resolve: (result: { data: unknown[]; error: null }) => void) {
              const index = cardRows.findIndex((row) => row[column as keyof CardRow] === value);
              const deleted = index === -1 ? [] : cardRows.splice(index, 1);
              resolve({ data: deleted.map((row) => project(row, columns)), error: null });
            },
          }),
        }),
      }),
    };
  },
  storage: {
    from: (bucket: string) => ({
      remove: (paths: string[]) => {
        if (removeFails) {
          return Promise.resolve({ data: null, error: { message: "boom" } });
        }
        removals.push({ bucket, paths, storedIds: cardRows.map((row) => row.id) });
        return Promise.resolve({ data: [], error: null });
      },
      createSignedUploadUrl: (path: string) => {
        signedPaths.push(path);
        return Promise.resolve({
          data: {
            path,
            token: "stub-token",
            signedUrl: `${testEnv.SUPABASE_URL}/storage/v1/object/upload/sign/${bucket}/${path}?token=stub-token`,
          },
          error: null,
        });
      },
    }),
  },
};

const anecdote = (title: string, overrides: Record<string, unknown> = {}) => ({
  type: "anecdote",
  title,
  payload: { body: "corps" },
  ...overrides,
});

const quizPayload = (correctIndex: number) => ({
  question: "En quelle année la Bastille a-t-elle été prise ?",
  choices: ["1789", "1792", "1848", "1815"].map((text, index) => ({
    text,
    correct: index === correctIndex,
  })),
  explanation: "Le 14 juillet 1789.",
});

const allCorrectQuiz = () => {
  const payload = quizPayload(0);
  return { ...payload, choices: payload.choices.map((choice) => ({ ...choice, correct: true })) };
};

const VASE = "Clovis a brisé lui-même le vase de Soissons.";

// One create body and one replace body per Card Type, each replacement changing what only that type has.
const roundTrips: [name: string, created: unknown, replaced: unknown][] = [
  ["Anecdote", anecdote("Mendès France"), anecdote("Mendès France", { payload: { body: "revu" } })],
  [
    "Quiz",
    { type: "quiz", title: "Bastille", payload: quizPayload(1) },
    { type: "quiz", title: "Bastille", payload: quizPayload(0) },
  ],
  [
    "True/False",
    {
      type: "true-false",
      title: "Vase",
      payload: { assertion: VASE, answer: true, explanation: "Si." },
    },
    {
      type: "true-false",
      title: "Vase",
      payload: { assertion: VASE, answer: false, explanation: "C'est un soldat qui l'a brisé." },
    },
  ],
  [
    "Riddle",
    {
      type: "riddle",
      title: "Sphinx",
      payload: { clues: "Le matin à quatre pattes.", answer: "L'homme", bonusInfo: "Œdipe." },
    },
    {
      type: "riddle",
      title: "Sphinx",
      payload: { clues: "Le matin à quatre pattes.", answer: "L'homme" },
    },
  ],
  [
    "Did You Know",
    { type: "did-you-know", title: "Tour Eiffel", payload: { body: "Elle grandit l'été." } },
    {
      type: "did-you-know",
      title: "Tour Eiffel",
      payload: { body: "La dilatation la fait grandir." },
    },
  ],
];

const THREE_IMAGES = [
  { path: "a.webp", order: 0, caption: "Première" },
  { path: "b.webp", order: 1 },
  { path: "c.webp", order: 2, caption: "Dernière" },
];

const UNKNOWN_ID = "ffffffff-ffff-4fff-8fff-ffffffffffff";

describe("admin card routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let editorToken: string;
  let playerToken: string;

  const call = (token: string, path: string, init: RequestInit = {}) =>
    fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
      },
    });

  const send = (token: string, method: string, path: string, body: unknown) =>
    call(token, path, { method, body: JSON.stringify(body) });

  const createCard = async (body: unknown) => {
    const response = await send(editorToken, "POST", "/admin/cards", body);
    expect(response.status).toBe(201);
    return await response.json();
  };

  beforeAll(async () => {
    signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    playerToken = await mint({ app_metadata: { provider: "google" } });

    const moduleRef = await Test.createTestingModule({ imports: [RootModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    cardRows = [];
    removals = [];
    signedPaths = [];
    removeFails = false;
    tick = 0;
    // A fresh Editor each time: one sub across the whole suite would spend its rate-limit allowance.
    editorToken = await mint({ app_metadata: { role: "editor" } });
  });

  const routes: [method: string, path: string, body?: unknown][] = [
    ["GET", "/admin/cards"],
    ["POST", "/admin/cards", anecdote("Refusée")],
    ["GET", `/admin/cards/${UNKNOWN_ID}`],
    ["PUT", `/admin/cards/${UNKNOWN_ID}`, anecdote("Refusée")],
    ["PATCH", `/admin/cards/${UNKNOWN_ID}/posted`, { postedOn: ["x"] }],
    ["DELETE", `/admin/cards/${UNKNOWN_ID}`],
    ["POST", "/admin/card-images/upload-url"],
  ];

  it.each(routes)("%s %s without a token → 401 UNAUTHENTICATED", async (method, path, body) => {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { body: JSON.stringify(body), headers: { "Content-Type": "application/json" } }),
    });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it.each(routes)("%s %s with a Player token → 403 FORBIDDEN", async (method, path, body) => {
    const response = await call(playerToken, path, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  // No uuid pre-validation lives in admin after its cutover, so a malformed id must read as unknown.
  const idRoutes: [method: string, suffix: string, body?: unknown][] = [
    ["GET", ""],
    ["PUT", "", anecdote("Fantôme")],
    ["PATCH", "/posted", { postedOn: ["x"] }],
    ["DELETE", ""],
  ];

  it.each(
    idRoutes.flatMap(([method, suffix, body]) =>
      ["not-a-uuid", UNKNOWN_ID].map(
        (id) => [method, id, suffix, body] as [string, string, string, unknown],
      ),
    ),
  )("%s /admin/cards/%s%s → 404 NOT_FOUND", async (method, id, suffix, body) => {
    const response = await call(editorToken, `/admin/cards/${id}${suffix}`, {
      method,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("NOT_FOUND");
  });

  it("POST /admin/cards creates a Card, normalizing Tags and ordering Images server-side", async () => {
    const created = await createCard(
      anecdote("Mendès France", {
        tags: ["  Histoire ", "HISTOIRE", "", "Révolution"],
        images: [
          { path: "b.webp", order: 1 },
          { path: "a.webp", order: 0, caption: "Première" },
        ],
      }),
    );

    expect(created).toMatchObject({
      type: "anecdote",
      title: "Mendès France",
      tags: ["histoire", "révolution"],
      postedOn: [],
      payload: { body: "corps" },
    });
    expect(created.images.map((image: CardImage) => image.path)).toEqual(["a.webp", "b.webp"]);
    expect(created.createdAt).toBe(created.updatedAt);
    expect(cardRows[0].tags).toEqual(["histoire", "révolution"]);
  });

  it.each([
    ["a blank Title", anecdote(" ")],
    ["an unknown Card Type", { type: "poem", title: "Poème", payload: { body: "corps" } }],
    [
      "a Quiz with two correct Choices",
      { type: "quiz", title: "Bastille", payload: allCorrectQuiz() },
    ],
    [
      "a fourth Image",
      anecdote("Trop illustrée", {
        images: [0, 1, 2, 3].map((order) => ({ path: `${order}.webp`, order })),
      }),
    ],
  ])("POST /admin/cards with %s → 400 VALIDATION_FAILED", async (_name, body) => {
    const response = await send(editorToken, "POST", "/admin/cards", body);
    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
    expect(cardRows).toEqual([]);
  });

  it("GET /admin/cards pages at 20 server-side, newest first, with the exact total", async () => {
    for (let index = 1; index <= CARD_LIST_PAGE_SIZE + 2; index += 1) {
      await createCard(anecdote(`Card ${index}`));
    }

    const first = await call(editorToken, "/admin/cards");
    expect(first.status).toBe(200);
    const firstBody = await first.json();
    expect(firstBody).toMatchObject({
      total: CARD_LIST_PAGE_SIZE + 2,
      page: 1,
      pageSize: CARD_LIST_PAGE_SIZE,
    });
    expect(firstBody.items).toHaveLength(CARD_LIST_PAGE_SIZE);
    expect(firstBody.items[0].title).toBe(`Card ${CARD_LIST_PAGE_SIZE + 2}`);

    const second = await call(editorToken, "/admin/cards?page=2");
    const secondBody = await second.json();
    expect(secondBody.items.map((item: { title: string }) => item.title)).toEqual([
      "Card 2",
      "Card 1",
    ]);
    expect(secondBody).toMatchObject({ total: CARD_LIST_PAGE_SIZE + 2, page: 2 });
  });

  it("GET /admin/cards?search= treats LIKE wildcards as literal characters", async () => {
    await createCard(anecdote("100% coton"));
    await createCard(anecdote("100x coton"));

    const response = await call(editorToken, `/admin/cards?search=${encodeURIComponent("100%")}`);
    const body = await response.json();
    expect(body.items.map((item: { title: string }) => item.title)).toEqual(["100% coton"]);
    expect(body.total).toBe(1);
  });

  it("GET /admin/cards composes a case-insensitive search with the Type and Tag filters", async () => {
    await createCard(anecdote("Bastille en fête", { tags: ["histoire"] }));
    await createCard({
      type: "quiz",
      title: "Bastille en quiz",
      tags: ["histoire"],
      payload: quizPayload(0),
    });
    await createCard(anecdote("Bastille ailleurs", { tags: ["géo"] }));
    await createCard(anecdote("Autre sujet", { tags: ["histoire"] }));

    const response = await call(
      editorToken,
      `/admin/cards?search=bastille&type=anecdote&tag=${encodeURIComponent("  Histoire ")}`,
    );
    const body = await response.json();
    expect(body.items.map((item: { title: string }) => item.title)).toEqual(["Bastille en fête"]);
    expect(body.total).toBe(1);
  });

  it("GET /admin/cards narrows by Tag alone and by Type alone", async () => {
    await createCard(anecdote("Taguée", { tags: ["histoire"] }));
    await createCard({ type: "quiz", title: "Quiz", payload: quizPayload(0) });
    await createCard(anecdote("Nue"));

    const byTag = await (await call(editorToken, "/admin/cards?tag=histoire")).json();
    expect(byTag.items.map((item: { title: string }) => item.title)).toEqual(["Taguée"]);

    const byType = await (await call(editorToken, "/admin/cards?type=quiz")).json();
    expect(byType.items.map((item: { title: string }) => item.title)).toEqual(["Quiz"]);
  });

  it("GET /admin/cards treats a blank search and a blank Tag as no filter", async () => {
    await createCard(anecdote("Une", { tags: ["histoire"] }));
    await createCard(anecdote("Deux"));

    const blanks = encodeURIComponent("   ");
    const response = await call(editorToken, `/admin/cards?search=${blanks}&tag=${blanks}`);
    expect((await response.json()).total).toBe(2);
  });

  it("GET /admin/cards beyond the last page is empty without losing the total", async () => {
    await createCard(anecdote("Seule"));

    const response = await call(editorToken, "/admin/cards?page=9");
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ items: [], total: 1, page: 9 });
  });

  it("GET /admin/cards/:id returns the stored Card", async () => {
    const created = await createCard(anecdote("Lookup"));

    const response = await call(editorToken, `/admin/cards/${created.id}`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(created);
  });

  it("PUT /admin/cards/:id replaces the content, bumps updatedAt and drops de-referenced Images", async () => {
    const created = await createCard(
      anecdote("Avant", {
        images: [
          { path: "a.webp", order: 0 },
          { path: "b.webp", order: 1 },
        ],
      }),
    );

    const response = await send(editorToken, "PUT", `/admin/cards/${created.id}`, {
      type: "riddle",
      title: "Après",
      images: [{ path: "b.webp", order: 0, caption: "Gardée" }],
      payload: { clues: "Prise le 14 juillet 1789.", answer: "La Bastille" },
    });
    expect(response.status).toBe(200);
    const updated = await response.json();
    expect(updated).toMatchObject({ id: created.id, type: "riddle", title: "Après" });
    expect(updated.images).toEqual([{ path: "b.webp", order: 0, caption: "Gardée" }]);
    expect(updated.updatedAt > created.updatedAt).toBe(true);
    expect(removals).toEqual([
      { bucket: "card-images", paths: ["a.webp"], storedIds: [created.id] },
    ]);
  });

  it("PUT /admin/cards/:id keeps a landed save when the Image cleanup fails", async () => {
    const created = await createCard(anecdote("Avant", { images: [{ path: "a.webp", order: 0 }] }));
    removeFails = true;

    const response = await send(editorToken, "PUT", `/admin/cards/${created.id}`, {
      type: "anecdote",
      title: "Après",
      payload: { body: "corps" },
    });
    expect(response.status).toBe(200);
    expect((await response.json()).title).toBe("Après");
    expect(cardRows[0].title).toBe("Après");
  });

  it.each(roundTrips)(
    "round-trips a %s Card through create, replace and read",
    async (_name, created, replaced) => {
      const card = await createCard(created);
      expect(card.payload).toEqual((created as { payload: unknown }).payload);

      const response = await send(editorToken, "PUT", `/admin/cards/${card.id}`, replaced);
      expect(response.status).toBe(200);
      const updated = await response.json();
      expect(updated.payload).toEqual((replaced as { payload: unknown }).payload);
      expect(updated.updatedAt > card.updatedAt).toBe(true);

      const reloaded = await call(editorToken, `/admin/cards/${card.id}`);
      expect(await reloaded.json()).toEqual(updated);
    },
  );

  it("PUT /admin/cards/:id changes the Card Type, keeping the shared fields", async () => {
    const created = await createCard({
      type: "quiz",
      title: "Bastille",
      tags: ["histoire", "révolution"],
      images: [{ path: "a.webp", order: 0, caption: "Première" }],
      payload: quizPayload(0),
    });

    const payload = { clues: "Prise le 14 juillet 1789.", answer: "La Bastille" };
    const response = await send(editorToken, "PUT", `/admin/cards/${created.id}`, {
      type: "riddle",
      title: created.title,
      tags: created.tags,
      images: created.images,
      payload,
    });
    const updated = await response.json();
    expect(updated).toMatchObject({
      id: created.id,
      type: "riddle",
      title: created.title,
      tags: created.tags,
      images: created.images,
      payload,
    });
    expect(removals).toEqual([]);
  });

  it("PUT /admin/cards/:id reorders Images and edits Captions without touching storage", async () => {
    const created = await createCard(anecdote("Illustrée", { images: THREE_IMAGES }));
    expect(created.images.map((image: CardImage) => image.path)).toEqual([
      "a.webp",
      "b.webp",
      "c.webp",
    ]);

    const reordered = [
      { path: "c.webp", order: 0, caption: "Dernière" },
      { path: "a.webp", order: 1, caption: "Première (retouchée)" },
      { path: "b.webp", order: 2 },
    ];
    const response = await send(
      editorToken,
      "PUT",
      `/admin/cards/${created.id}`,
      anecdote("Illustrée", { images: reordered }),
    );
    expect((await response.json()).images).toEqual(reordered);
    expect(removals).toEqual([]);
  });

  it("PUT /admin/cards/:id keeps the Images intact through an unrelated edit", async () => {
    const created = await createCard(anecdote("Avant", { images: THREE_IMAGES }));

    const response = await send(
      editorToken,
      "PUT",
      `/admin/cards/${created.id}`,
      anecdote("Après", { images: created.images }),
    );
    const updated = await response.json();
    expect(updated.title).toBe("Après");
    expect(updated.images).toEqual(created.images);
    expect(removals).toEqual([]);
  });

  it("PATCH /admin/cards/:id/posted replaces the whole set without reordering the library", async () => {
    const first = await createCard(anecdote("First"));
    const second = await createCard(anecdote("Second"));

    const marked = await send(editorToken, "PATCH", `/admin/cards/${first.id}/posted`, {
      postedOn: ["linkedin", "x", "linkedin"],
    });
    expect(marked.status).toBe(200);
    const markedBody = await marked.json();
    expect(markedBody.postedOn).toEqual(["linkedin", "x"]);
    expect(markedBody.updatedAt).toBe(first.updatedAt);

    const repeated = await send(editorToken, "PATCH", `/admin/cards/${first.id}/posted`, {
      postedOn: ["linkedin", "x"],
    });
    expect((await repeated.json()).postedOn).toEqual(["linkedin", "x"]);

    const cleared = await send(editorToken, "PATCH", `/admin/cards/${first.id}/posted`, {
      postedOn: [],
    });
    expect((await cleared.json()).postedOn).toEqual([]);

    const list = await call(editorToken, "/admin/cards");
    expect((await list.json()).items.map((item: { title: string }) => item.title)).toEqual([
      second.title,
      first.title,
    ]);
  });

  it.each([
    ["an unknown Social", { postedOn: ["myspace"] }],
    ["no postedOn at all", {}],
  ])("PATCH /admin/cards/:id/posted with %s → 400, marks untouched", async (_name, body) => {
    const created = await createCard(anecdote("Marquée"));
    await send(editorToken, "PATCH", `/admin/cards/${created.id}/posted`, { postedOn: ["x"] });

    const response = await send(editorToken, "PATCH", `/admin/cards/${created.id}/posted`, body);
    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
    expect(cardRows[0].posted_on).toEqual(["x"]);
  });

  it("DELETE /admin/cards/:id removes the row first, then its storage objects", async () => {
    const doomed = await createCard(
      anecdote("Illustrée", {
        images: [
          { path: "a.webp", order: 0 },
          { path: "b.webp", order: 1 },
        ],
      }),
    );
    const kept = await createCard(anecdote("Gardée"));

    const response = await call(editorToken, `/admin/cards/${doomed.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);
    expect(cardRows.map((row) => row.id)).toEqual([kept.id]);
    expect(removals).toEqual([
      { bucket: "card-images", paths: ["a.webp", "b.webp"], storedIds: [kept.id] },
    ]);
  });

  it("DELETE /admin/cards/:id keeps the row deleted when the storage cleanup fails", async () => {
    const doomed = await createCard(
      anecdote("Illustrée", { images: [{ path: "a.webp", order: 0 }] }),
    );
    removeFails = true;

    const response = await call(editorToken, `/admin/cards/${doomed.id}`, { method: "DELETE" });
    expect(response.status).toBe(500);
    expect(cardRows).toEqual([]);
  });

  it("DELETE /admin/cards/:id makes no storage request for a Card without Images", async () => {
    const doomed = await createCard(anecdote("Nue"));

    const response = await call(editorToken, `/admin/cards/${doomed.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);
    expect(removals).toEqual([]);
  });

  it("POST /admin/card-images/upload-url mints a signed URL for one webp object", async () => {
    const response = await call(editorToken, "/admin/card-images/upload-url", { method: "POST" });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(signedPaths).toEqual([body.path]);
    expect(body.path).toMatch(/^[0-9a-f-]{36}\.webp$/);
    expect(body.signedUrl).toContain(`/card-images/${body.path}`);
  });
});
