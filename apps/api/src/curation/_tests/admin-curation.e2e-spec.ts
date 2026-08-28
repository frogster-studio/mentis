import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import {
  type CuratedCategory,
  type CuratedQuestion,
  type CuratedTheme,
  CurationRepository,
} from "../repositories/curation.repository";

const PLAYER_ID = "11111111-1111-4111-8111-111111111111";
const EDITOR_ID = "22222222-2222-4222-8222-222222222222";
const TELEVISION = "3f1d0d3a-0000-4000-8000-000000000001";
const HISTOIRE = "3f1d0d3a-0000-4000-8000-000000000002";
const SIMPSON = "5c2e0d3a-0000-4000-8000-000000000001";
const BROUILLON = "5c2e0d3a-0000-4000-8000-000000000002";

type Aged<Row> = Row & { createdAt: string };

const newestFirst = <Row>(rows: Aged<Row>[]): Row[] =>
  [...rows]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(({ createdAt: _dropped, ...row }) => row as Row);

const storedCategories: Aged<CuratedCategory>[] = [
  {
    id: TELEVISION,
    name: "Télévision",
    color: "#8e24aa",
    icon: "tv",
    createdAt: "2026-08-01T10:00:00.000Z",
  },
  {
    id: HISTOIRE,
    name: "Histoire",
    color: "#6d4c41",
    icon: "history-edu",
    createdAt: "2026-08-20T10:00:00.000Z",
  },
];

const storedThemes: Aged<Omit<CuratedTheme, "questionCount" | "readyQuestionCount">>[] = [
  {
    id: SIMPSON,
    name: "Les Simpson",
    categoryId: TELEVISION,
    image: "les-simpson.webp",
    published: true,
    createdAt: "2026-08-05T10:00:00.000Z",
  },
  {
    id: BROUILLON,
    name: "Brouillon",
    categoryId: HISTOIRE,
    image: "brouillon.webp",
    published: false,
    createdAt: "2026-08-22T10:00:00.000Z",
  },
];

const question = (
  id: string,
  themeId: string,
  readyToBePublished: boolean,
  createdAt: string,
): Aged<CuratedQuestion> => ({
  id,
  themeId,
  text: `${id} ?`,
  answer: "42",
  aliases: [],
  misspellings: [],
  wrongChoices: ["1", "2", "3"],
  readyToBePublished,
  createdAt,
});

const storedQuestions = [
  question("9a3e0d3a-0000-4000-8000-000000000001", SIMPSON, true, "2026-08-06T10:00:00.000Z"),
  question("9a3e0d3a-0000-4000-8000-000000000002", SIMPSON, true, "2026-08-09T10:00:00.000Z"),
  question("9a3e0d3a-0000-4000-8000-000000000003", SIMPSON, false, "2026-08-07T10:00:00.000Z"),
  question("9a3e0d3a-0000-4000-8000-000000000004", BROUILLON, false, "2026-08-23T10:00:00.000Z"),
];

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCurationRepository = {
  async listCategories() {
    return newestFirst(storedCategories);
  },
  async listThemes() {
    return newestFirst(storedThemes).map((theme) => ({
      ...theme,
      questionCount: storedQuestions.filter((row) => row.themeId === theme.id).length,
      readyQuestionCount: storedQuestions.filter(
        (row) => row.themeId === theme.id && row.readyToBePublished,
      ).length,
    }));
  },
  async listQuestions(themeId) {
    return newestFirst(storedQuestions.filter((row) => row.themeId === themeId));
  },
} satisfies Pick<CurationRepository, "listCategories" | "listThemes" | "listQuestions">;

const LIST_ROUTES = ["/admin/categories", "/admin/themes", `/admin/questions?themeId=${SIMPSON}`];

describe("admin curation routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let playerToken: string;
  let editorToken: string;

  const asEditor = (path: string) =>
    fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${editorToken}` } });

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
        image: "brouillon.webp",
        published: false,
        questionCount: 1,
        readyQuestionCount: 0,
      },
      {
        id: SIMPSON,
        name: "Les Simpson",
        categoryId: TELEVISION,
        image: "les-simpson.webp",
        published: true,
        questionCount: 3,
        readyQuestionCount: 2,
      },
    ]);
  });

  it("GET /admin/questions?themeId= serves that Theme's Questions, staged or not, newest first", async () => {
    const body = await (await asEditor(`/admin/questions?themeId=${SIMPSON}`)).json();
    expect(body.map((row: { id: string }) => row.id)).toEqual([
      "9a3e0d3a-0000-4000-8000-000000000002",
      "9a3e0d3a-0000-4000-8000-000000000003",
      "9a3e0d3a-0000-4000-8000-000000000001",
    ]);
    expect(body[1]).toEqual({
      id: "9a3e0d3a-0000-4000-8000-000000000003",
      themeId: SIMPSON,
      text: "9a3e0d3a-0000-4000-8000-000000000003 ?",
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
});
