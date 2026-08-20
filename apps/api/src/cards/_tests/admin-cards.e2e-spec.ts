import { randomUUID } from "node:crypto";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import {
  createLocalJWKSet,
  exportJWK,
  type GenerateKeyPairResult,
  generateKeyPair,
  type JWTPayload,
  SignJWT,
} from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { CardEntity } from "../../_database/entities/card.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { JWKS } from "../../auth/jwks";
import { ENV } from "../../env";
import { RootModule } from "../../root.module";
import { SUPABASE } from "../../supabase";
import { type CardContent, CardsRepository } from "../repositories/cards.repository";
import { CARD_LIST_PAGE_SIZE } from "../services/cards.service";

type CardImage = { path: string; order: number; caption?: string };

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

let rows: CardEntity[] = [];
let removals: Removal[] = [];
let signedPaths: string[] = [];
let removeFails = false;
let tick = 0;

const nextTimestamp = (): Date => {
  tick += 1;
  return new Date(Date.UTC(2026, 7, 11, 12, 0, tick));
};

const findRow = (id: string): CardEntity | null => rows.find((row) => row.id === id) ?? null;

const CONTENT_KEYS = ["type", "title", "tags", "payload", "images"] as const;

const contentChanged = (row: CardEntity, content: CardContent): boolean =>
  CONTENT_KEYS.some((key) => JSON.stringify(row[key]) !== JSON.stringify(content[key]));

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCardsRepository = {
  async list(filters, page, pageSize) {
    let subset = rows;
    if (filters.search !== undefined) {
      const needle = filters.search.toLowerCase();
      subset = subset.filter((row) => row.title.toLowerCase().includes(needle));
    }
    if (filters.type !== undefined) {
      subset = subset.filter((row) => row.type === filters.type);
    }
    if (filters.tag !== undefined) {
      subset = subset.filter((row) => row.tags.includes(filters.tag as string));
    }
    const sorted = [...subset].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const offset = (page - 1) * pageSize;
    return { items: sorted.slice(offset, offset + pageSize), total: sorted.length };
  },
  async findById(id) {
    return findRow(id);
  },
  async create(content) {
    const now = nextTimestamp();
    const row: CardEntity = {
      id: randomUUID(),
      ...content,
      postedOn: [],
      createdAt: now,
      updatedAt: now,
    };
    rows.push(row);
    return row;
  },
  async replace(id, content) {
    const row = findRow(id);
    if (row === null) {
      return null;
    }
    // Mirrors the cards_set_updated_at trigger: only a content change moves the stamp.
    if (contentChanged(row, content)) {
      row.updatedAt = nextTimestamp();
    }
    Object.assign(row, content);
    return row;
  },
  async setPosted(id, postedOn) {
    const row = findRow(id);
    if (row === null) {
      return null;
    }
    row.postedOn = postedOn;
    return row;
  },
  async imagePaths(id) {
    const row = findRow(id);
    return row === null ? null : row.images.map((image) => image.path);
  },
  async remove(id) {
    const index = rows.findIndex((row) => row.id === id);
    if (index === -1) {
      return null;
    }
    const [gone] = rows.splice(index, 1);
    return { imagePaths: gone.images.map((image) => image.path) };
  },
} satisfies Pick<
  CardsRepository,
  "list" | "findById" | "create" | "replace" | "setPosted" | "imagePaths" | "remove"
>;

const stubSupabase = {
  storage: {
    from: (bucket: string) => ({
      remove: (paths: string[]) => {
        if (removeFails) {
          return Promise.resolve({ data: null, error: { message: "boom" } });
        }
        removals.push({ bucket, paths, storedIds: rows.map((row) => row.id) });
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
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(CardsRepository)
      .useValue(fakeCardsRepository)
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
    rows = [];
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
    expect(rows[0].tags).toEqual(["histoire", "révolution"]);
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
    expect(rows).toEqual([]);
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
    expect(rows[0].title).toBe("Après");
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
    expect(rows[0].postedOn).toEqual(["x"]);
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
    expect(rows.map((row) => row.id)).toEqual([kept.id]);
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
    expect(rows).toEqual([]);
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
