import { errorResponseSchema } from "@mentis/contracts/shared";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { SUPABASE } from "../../_config/supabase.config";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import { configureApp, JSON_BODY_LIMIT, NEST_OPTIONS } from "../../bootstrap";
import { ANECDOTE_IMAGES_BUCKET } from "../../catalog/utils/anecdote-image-url";
import { ANECDOTE_IMAGE_BODY_LIMIT } from "../modules/curation.module";
import { CurationRepository } from "../repositories/curation.repository";
import { extended, lossless, lossy, png } from "./webp-fixtures";

const PLAYER_ID = "11111111-1111-4111-8111-111111111111";
const EDITOR_ID = "22222222-2222-4222-8222-222222222222";
const BARE = "7b4e0d3a-0000-4000-8000-000000000001";
const ILLUSTRATED = "7b4e0d3a-0000-4000-8000-000000000002";
const UNKNOWN_ANECDOTE = "7b4e0d3a-0000-4000-8000-00000000ffff";
const PREVIOUS_IMAGE = `${ILLUSTRATED}/0d9f0d3a-0000-4000-8000-000000000001.webp`;

const anecdote = (id: string, image: string | null): AnecdoteEntity =>
  Object.assign(new AnecdoteEntity(), { id, text: `Anecdote ${id}`, image });

const storedAnecdotes = [anecdote(BARE, null), anecdote(ILLUSTRATED, PREVIOUS_IMAGE)];

const FINISHED_IMAGE = lossless(750, 1024);

let liveAnecdotes: AnecdoteEntity[] = [];
let events: string[] = [];
let uploads: { bucket: string; path: string; bytes: Buffer; contentType?: string }[] = [];
let removals: { bucket: string; paths: string[] }[] = [];
let failUpload = false;
let failRemove: () => Promise<{ error: Error | null }> = async () => ({ error: null });

// Stands in for Postgres at the repository seam: the SQL itself is proven by the live smoke.
const fakeCurationRepository = {
  async findAnecdote(id) {
    return liveAnecdotes.find((row) => row.id === id) ?? null;
  },
  async updateAnecdote(authored) {
    const stored = liveAnecdotes.find((row) => row.id === authored.id);
    if (stored === undefined) return null;
    events.push("save");
    const updated = Object.assign(new AnecdoteEntity(), stored, authored);
    liveAnecdotes = liveAnecdotes.map((row) => (row.id === updated.id ? updated : row));
    return updated;
  },
} satisfies Pick<CurationRepository, "findAnecdote" | "updateAnecdote">;

const stubSupabase = {
  storage: {
    from: (bucket: string) => ({
      upload: async (path: string, bytes: Buffer, options: { contentType?: string }) => {
        if (failUpload) return { data: null, error: new Error("storage down") };
        events.push("upload");
        uploads.push({ bucket, path, bytes, contentType: options.contentType });
        return { data: { path }, error: null };
      },
      remove: (paths: string[]) => {
        events.push("remove");
        removals.push({ bucket, paths });
        return failRemove();
      },
    }),
  },
};

describe("PUT /admin/anecdotes/:id/image e2e", () => {
  let app: NestExpressApplication;
  let baseUrl: string;
  let playerToken: string;
  let editorToken: string;

  const putImage = (
    id: string,
    body: Buffer,
    token: string | null = editorToken,
  ): Promise<Response> =>
    fetch(`${baseUrl}/admin/anecdotes/${id}/image`, {
      method: "PUT",
      headers: {
        "content-type": "image/webp",
        ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      },
      body: new Uint8Array(body),
    });

  beforeEach(() => {
    liveAnecdotes = [...storedAnecdotes];
    events = [];
    uploads = [];
    removals = [];
    failUpload = false;
    failRemove = async () => ({ error: null });
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
      .overrideProvider(SUPABASE)
      .useValue(stubSupabase)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication<NestExpressApplication>(NEST_OPTIONS);
    configureApp(app);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  it("without a token → 401 UNAUTHENTICATED", async () => {
    const response = await putImage(BARE, FINISHED_IMAGE, null);

    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("with a player token → 403 FORBIDDEN", async () => {
    const response = await putImage(BARE, FINISHED_IMAGE, playerToken);

    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  it("for an unknown Anecdote → 404 NOT_FOUND, nothing uploaded", async () => {
    const response = await putImage(UNKNOWN_ANECDOTE, FINISHED_IMAGE);

    expect(response.status).toBe(404);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("NOT_FOUND");
    expect(uploads).toEqual([]);
  });

  it.each([
    ["a PNG", png, "L’image doit être un fichier WebP."],
    ["an empty body", Buffer.alloc(0), "L’image doit être un fichier WebP."],
    ["an animated WebP", extended(750, 1024, 0x02), "L’image ne doit pas être animée."],
    ["a landscape WebP", lossy(1024, 750), "L’image doit mesurer 750 × 1024 px."],
  ])("with %s → 400 VALIDATION_FAILED in French, nothing uploaded", async (_, body, message) => {
    const response = await putImage(BARE, body);

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json())).toMatchObject({
      code: "VALIDATION_FAILED",
      message,
    });
    expect(uploads).toEqual([]);
  });

  it("above 204 800 bytes → 413 PAYLOAD_TOO_LARGE envelope, nothing uploaded", async () => {
    const oversize = Buffer.concat([FINISHED_IMAGE, Buffer.alloc(ANECDOTE_IMAGE_BODY_LIMIT)]);
    const response = await putImage(BARE, oversize);

    expect(response.status).toBe(413);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("PAYLOAD_TOO_LARGE");
    expect(uploads).toEqual([]);
  });

  it("stores a WebP of exactly 204 800 bytes", async () => {
    const atTheCap = Buffer.concat([
      FINISHED_IMAGE,
      Buffer.alloc(ANECDOTE_IMAGE_BODY_LIMIT - FINISHED_IMAGE.length),
    ]);

    expect((await putImage(BARE, atTheCap)).status).toBe(200);
  });

  it("uploads the file to a fresh path of the anecdote-images bucket and answers the Anecdote", async () => {
    const response = await putImage(BARE, FINISHED_IMAGE);

    expect(response.status).toBe(200);
    const saved = await response.json();
    expect(saved).toEqual({ id: BARE, text: `Anecdote ${BARE}`, image: expect.any(String) });
    expect(saved.image).toMatch(new RegExp(`^${BARE}/[0-9a-f-]{36}\\.webp$`));
    expect(uploads).toEqual([
      {
        bucket: ANECDOTE_IMAGES_BUCKET,
        path: saved.image,
        bytes: FINISHED_IMAGE,
        contentType: "image/webp",
      },
    ]);
    expect(removals).toEqual([]);
  });

  it("deletes the previous object only once the new reference is saved", async () => {
    const response = await putImage(ILLUSTRATED, FINISHED_IMAGE);

    expect(response.status).toBe(200);
    expect((await response.json()).image).not.toBe(PREVIOUS_IMAGE);
    expect(events).toEqual(["upload", "save", "remove"]);
    expect(removals).toEqual([{ bucket: ANECDOTE_IMAGES_BUCKET, paths: [PREVIOUS_IMAGE] }]);
  });

  it.each([
    ["answers an error", async () => ({ error: new Error("storage down") })],
    ["throws", () => Promise.reject(new Error("network down"))],
  ])("still answers 200 when the deletion %s", async (_, removal) => {
    failRemove = removal;
    const response = await putImage(ILLUSTRATED, FINISHED_IMAGE);

    expect(response.status).toBe(200);
    expect((await response.json()).image).toBe(uploads[0].path);
  });

  it("a failed upload → 502, the Anecdote keeps its image", async () => {
    failUpload = true;
    const response = await putImage(ILLUSTRATED, FINISHED_IMAGE);

    expect(response.status).toBe(502);
    errorResponseSchema.parse(await response.json());
    expect(liveAnecdotes.find((row) => row.id === ILLUSTRATED)?.image).toBe(PREVIOUS_IMAGE);
    expect(removals).toEqual([]);
  });

  it("another route never reads a WebP body raw", async () => {
    const response = await fetch(`${baseUrl}/admin/anecdotes`, {
      method: "POST",
      headers: { "content-type": "image/webp", Authorization: `Bearer ${editorToken}` },
      body: new Uint8Array(FINISHED_IMAGE),
    });

    expect(response.status).toBe(400);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("VALIDATION_FAILED");
  });

  it("a JSON route still refuses a body above 64 kb → 413", async () => {
    const response = await fetch(`${baseUrl}/admin/anecdotes`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${editorToken}` },
      body: JSON.stringify({ text: "x".repeat(Number.parseInt(JSON_BODY_LIMIT, 10) * 1024) }),
    });

    expect(response.status).toBe(413);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("PAYLOAD_TOO_LARGE");
  });
});
