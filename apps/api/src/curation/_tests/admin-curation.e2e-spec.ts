import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import { CurationRepository } from "../repositories/curation.repository";

const PLAYER_ID = "11111111-1111-4111-8111-111111111111";
const EDITOR_ID = "22222222-2222-4222-8222-222222222222";
const TELEVISION = "3f1d0d3a-0000-4000-8000-000000000001";
const HISTOIRE = "3f1d0d3a-0000-4000-8000-000000000002";
const SIMPSON = "5c2e0d3a-0000-4000-8000-000000000001";
const BROUILLON = "5c2e0d3a-0000-4000-8000-000000000002";
const CAPITALE = "9a3e0d3a-0000-4000-8000-000000000001";
const DRAPEAU = "9a3e0d3a-0000-4000-8000-000000000002";
const MONNAIE = "9a3e0d3a-0000-4000-8000-000000000003";
const BROUILLON_QUESTION = "9a3e0d3a-0000-4000-8000-000000000004";
const AUTHORED = "9a3e0d3a-0000-4000-8000-000000000005";
const UNKNOWN_QUESTION = "9a3e0d3a-0000-4000-8000-00000000ffff";

type Aged = { createdAt: Date };

const newestFirst = <Row extends Aged>(rows: Row[]): Row[] =>
  [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

const category = (
  id: string,
  name: string,
  color: string,
  icon: string,
  createdAt: string,
): CategoryEntity =>
  Object.assign(new CategoryEntity(), {
    id,
    slug: name.toLowerCase(),
    name,
    color,
    icon,
    createdAt: new Date(createdAt),
  });

const storedCategories = [
  category(TELEVISION, "Télévision", "#8e24aa", "tv", "2026-08-01T10:00:00.000Z"),
  category(HISTOIRE, "Histoire", "#6d4c41", "history-edu", "2026-08-20T10:00:00.000Z"),
];

const theme = (
  id: string,
  name: string,
  categoryId: string,
  published: boolean,
  createdAt: string,
): ThemeEntity =>
  Object.assign(new ThemeEntity(), {
    id,
    slug: name.toLowerCase(),
    name,
    categoryId,
    image: `${id}.webp`,
    published,
    createdAt: new Date(createdAt),
  });

const storedThemes = [
  theme(SIMPSON, "Les Simpson", TELEVISION, true, "2026-08-05T10:00:00.000Z"),
  theme(BROUILLON, "Brouillon", HISTOIRE, false, "2026-08-22T10:00:00.000Z"),
];

const question = (
  id: string,
  themeId: string,
  readyToBePublished: boolean,
  createdAt: string,
): QuestionEntity =>
  Object.assign(new QuestionEntity(), {
    id,
    themeId,
    text: `${id} ?`,
    answer: "42",
    aliases: [],
    misspellings: [],
    wrongChoices: ["1", "2", "3"],
    readyToBePublished,
    createdAt: new Date(createdAt),
  });

const storedQuestions = [
  question(CAPITALE, SIMPSON, true, "2026-08-06T10:00:00.000Z"),
  question(DRAPEAU, SIMPSON, true, "2026-08-09T10:00:00.000Z"),
  question(MONNAIE, SIMPSON, false, "2026-08-07T10:00:00.000Z"),
  question(BROUILLON_QUESTION, BROUILLON, false, "2026-08-23T10:00:00.000Z"),
];

let liveQuestions: QuestionEntity[] = [];

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCurationRepository = {
  async listCategories() {
    return newestFirst(storedCategories);
  },
  async listThemes() {
    return newestFirst(storedThemes).map((entity) => ({
      entity,
      questionCount: liveQuestions.filter((row) => row.themeId === entity.id).length,
      readyQuestionCount: liveQuestions.filter(
        (row) => row.themeId === entity.id && row.readyToBePublished,
      ).length,
    }));
  },
  async listQuestions(themeId) {
    return newestFirst(liveQuestions.filter((row) => row.themeId === themeId));
  },
  async createQuestion(authored) {
    const created = Object.assign(new QuestionEntity(), authored, {
      id: AUTHORED,
      createdAt: new Date("2026-08-24T10:00:00.000Z"),
    });
    liveQuestions.push(created);
    return created;
  },
  async updateQuestion(authored) {
    const stored = liveQuestions.find((row) => row.id === authored.id);
    if (stored === undefined) {
      return null;
    }
    const updated = Object.assign(new QuestionEntity(), stored, authored);
    liveQuestions = liveQuestions.map((row) => (row.id === updated.id ? updated : row));
    return updated;
  },
  async deleteQuestion(id) {
    const remaining = liveQuestions.filter((row) => row.id !== id);
    const wasDeleted = remaining.length < liveQuestions.length;
    liveQuestions = remaining;
    return wasDeleted;
  },
} satisfies Pick<
  CurationRepository,
  | "listCategories"
  | "listThemes"
  | "listQuestions"
  | "createQuestion"
  | "updateQuestion"
  | "deleteQuestion"
>;

const AUTHORED_QUESTION = {
  themeId: SIMPSON,
  text: "Quelle est la capitale de l'Australie ?",
  answer: "Canberra",
  wrongChoices: ["Sydney", "Melbourne", "Perth"],
  aliases: ["Canbera City"],
  misspellings: ["Camberra"],
};

const WRITE_ROUTES = [
  { method: "POST", path: "/admin/questions", body: AUTHORED_QUESTION },
  { method: "PATCH", path: `/admin/questions/${CAPITALE}`, body: AUTHORED_QUESTION },
  { method: "DELETE", path: `/admin/questions/${CAPITALE}`, body: undefined },
];

const LIST_ROUTES = ["/admin/categories", "/admin/themes", `/admin/questions?themeId=${SIMPSON}`];

describe("admin curation routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let playerToken: string;
  let editorToken: string;

  const asEditor = (path: string) =>
    fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${editorToken}` } });

  const write = (
    route: { method: string; path: string; body?: unknown },
    token?: string,
  ): Promise<Response> =>
    fetch(`${baseUrl}${route.path}`, {
      method: route.method,
      headers: {
        ...(token === undefined ? {} : { Authorization: `Bearer ${token}` }),
        ...(route.body === undefined ? {} : { "content-type": "application/json" }),
      },
      body: route.body === undefined ? undefined : JSON.stringify(route.body),
    });

  beforeEach(() => {
    liveQuestions = [...storedQuestions];
  });

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    const mint = (sub: string, appMetadata: JWTPayload): Promise<string> =>
      new SignJWT({
        iss: `${testEnv.SUPABASE_URL}/auth/v1`,
        aud: "authenticated",
        sub,
        role: "authenticated",
        app_metadata: appMetadata,
      } satisfies JWTPayload)
        .setProtectedHeader({ alg: "ES256", kid: "test-key" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(signingKey.privateKey);
    playerToken = await mint(PLAYER_ID, { provider: "google" });
    editorToken = await mint(EDITOR_ID, { provider: "email", role: "editor" });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(CurationRepository)
      .useValue(fakeCurationRepository)
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

  it.each(LIST_ROUTES)("GET %s anonymously → 401 UNAUTHENTICATED", async (path) => {
    const response = await fetch(`${baseUrl}${path}`);
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it.each(LIST_ROUTES)("GET %s with a player token → 403 FORBIDDEN", async (path) => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${playerToken}` },
    });
    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  it.each(LIST_ROUTES)("GET %s with an editor token → 200", async (path) => {
    expect((await asEditor(path)).status).toBe(200);
  });

  it("GET /admin/categories serves every Category, newest first", async () => {
    expect(await (await asEditor("/admin/categories")).json()).toEqual([
      { id: HISTOIRE, name: "Histoire", color: "#6d4c41", icon: "history-edu" },
      { id: TELEVISION, name: "Télévision", color: "#8e24aa", icon: "tv" },
    ]);
  });

  it("GET /admin/themes serves unpublished Themes too, with both Question counts", async () => {
    expect(await (await asEditor("/admin/themes")).json()).toEqual([
      {
        id: BROUILLON,
        name: "Brouillon",
        categoryId: HISTOIRE,
        image: `${BROUILLON}.webp`,
        published: false,
        questionCount: 1,
        readyQuestionCount: 0,
      },
      {
        id: SIMPSON,
        name: "Les Simpson",
        categoryId: TELEVISION,
        image: `${SIMPSON}.webp`,
        published: true,
        questionCount: 3,
        readyQuestionCount: 2,
      },
    ]);
  });

  it("GET /admin/questions?themeId= serves that Theme's Questions, staged or not, newest first", async () => {
    const body = await (await asEditor(`/admin/questions?themeId=${SIMPSON}`)).json();
    expect(body.map((row: { id: string }) => row.id)).toEqual([DRAPEAU, MONNAIE, CAPITALE]);
    expect(body[1]).toEqual({
      id: MONNAIE,
      themeId: SIMPSON,
      text: `${MONNAIE} ?`,
      answer: "42",
      aliases: [],
      misspellings: [],
      wrongChoices: ["1", "2", "3"],
      readyToBePublished: false,
    });
  });

  it.each(["", "?themeId=", "?themeId=les-simpson"])(
    "GET /admin/questions%s → 400 VALIDATION_FAILED",
    async (query) => {
      const response = await asEditor(`/admin/questions${query}`);
      expect(response.status).toBe(400);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
    },
  );

  it.each(WRITE_ROUTES)("$method $path anonymously → 401 UNAUTHENTICATED", async (route) => {
    const response = await write(route);
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it.each(WRITE_ROUTES)("$method $path with a player token → 403 FORBIDDEN", async (route) => {
    const response = await write(route, playerToken);
    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  it("POST /admin/questions stores the Question unstaged, its variants lowercased", async () => {
    const response = await write(WRITE_ROUTES[0], editorToken);

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: AUTHORED,
      themeId: SIMPSON,
      text: "Quelle est la capitale de l'Australie ?",
      answer: "Canberra",
      wrongChoices: ["Sydney", "Melbourne", "Perth"],
      aliases: ["canbera city"],
      misspellings: ["camberra"],
      readyToBePublished: false,
    });
  });

  it("POST /admin/questions puts the new Question on top of its Theme's column", async () => {
    await write(WRITE_ROUTES[0], editorToken);

    const body = await (await asEditor(`/admin/questions?themeId=${SIMPSON}`)).json();
    expect(body.map((row: { id: string }) => row.id)).toEqual([
      AUTHORED,
      DRAPEAU,
      MONNAIE,
      CAPITALE,
    ]);
  });

  it.each([
    ["no text", { text: "   " }],
    ["no designated correct answer", { answer: "" }],
    ["three answers only", { wrongChoices: ["Sydney", "Melbourne"] }],
    ["a wrong choice repeating the correct one", { wrongChoices: ["Sydney", "canberra", "Perth"] }],
  ])("POST /admin/questions with %s → 400 VALIDATION_FAILED", async (_case, incomplete) => {
    const response = await write(
      { method: "POST", path: "/admin/questions", body: { ...AUTHORED_QUESTION, ...incomplete } },
      editorToken,
    );

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
  });

  it("PATCH /admin/questions/:id rewrites the Question and leaves its staging flag alone", async () => {
    const response = await write(WRITE_ROUTES[1], editorToken);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: CAPITALE,
      themeId: SIMPSON,
      text: "Quelle est la capitale de l'Australie ?",
      answer: "Canberra",
      wrongChoices: ["Sydney", "Melbourne", "Perth"],
      aliases: ["canbera city"],
      misspellings: ["camberra"],
      readyToBePublished: true,
    });
  });

  it("DELETE /admin/questions/:id drops it from its Theme's column", async () => {
    const response = await write(WRITE_ROUTES[2], editorToken);

    expect(response.status).toBe(204);
    const body = await (await asEditor(`/admin/questions?themeId=${SIMPSON}`)).json();
    expect(body.map((row: { id: string }) => row.id)).toEqual([DRAPEAU, MONNAIE]);
  });

  it.each(["PATCH", "DELETE"])(
    "%s /admin/questions on an unknown id → 404 NOT_FOUND",
    async (method) => {
      const response = await write(
        {
          method,
          path: `/admin/questions/${UNKNOWN_QUESTION}`,
          body: method === "PATCH" ? AUTHORED_QUESTION : undefined,
        },
        editorToken,
      );

      expect(response.status).toBe(404);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("NOT_FOUND");
    },
  );

  it.each(["PATCH", "DELETE"])("%s /admin/questions on a malformed id → 400", async (method) => {
    const response = await write(
      {
        method,
        path: "/admin/questions/les-simpson",
        body: method === "PATCH" ? AUTHORED_QUESTION : undefined,
      },
      editorToken,
    );

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
  });
});
