import { errorResponseSchema } from "@mentis/contracts/shared";
import { Controller, Get, type INestApplication, Req, UseGuards } from "@nestjs/common";
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
import { stubDataSource, testEnv } from "../src/_tests/test-env";
import { EditorGuard } from "../src/auth/editor.guard";
import { JWKS } from "../src/auth/jwks";
import {
  type AuthedRequest,
  type AuthedUser,
  SupabaseUserGuard,
} from "../src/auth/supabase-user.guard";
import { ENV } from "../src/env";
import { RootModule } from "../src/root.module";

const ISSUER = `${testEnv.SUPABASE_URL}/auth/v1`;
const PLAYER_ID = "11111111-1111-4111-8111-111111111111";
const EDITOR_ID = "22222222-2222-4222-8222-222222222222";

let signingKey: GenerateKeyPairResult;
let foreignKey: GenerateKeyPairResult;

const mint = (
  claims: JWTPayload,
  options: { key?: CryptoKey; expiresIn?: string | number } = {},
): Promise<string> =>
  new SignJWT(claims)
    .setProtectedHeader({ alg: "ES256", kid: "test-key" })
    .setIssuedAt()
    .setExpirationTime(options.expiresIn ?? "1h")
    .sign(options.key ?? signingKey.privateKey);

const playerClaims = (overrides: JWTPayload = {}): JWTPayload => ({
  iss: ISSUER,
  aud: "authenticated",
  sub: PLAYER_ID,
  role: "authenticated",
  email: "player@mentis.test",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: { full_name: "Player One" },
  ...overrides,
});

const editorClaims = (): JWTPayload =>
  playerClaims({
    sub: EDITOR_ID,
    email: "editor@mentis.test",
    app_metadata: { provider: "email", role: "editor" },
  });

// Each one is a 401: the union of "not our token" and "not an authenticated user token".
const rejected: [name: string, authorization: () => Promise<string>][] = [
  ["a non-bearer scheme", async () => "Basic cGxheWVyOnBhc3M="],
  ["a malformed token", async () => "Bearer not-a-jwt"],
  ["an empty bearer value", async () => "Bearer "],
  [
    "a token that expired an hour ago",
    async () => `Bearer ${await mint(playerClaims(), { expiresIn: "-1h" })}`,
  ],
  [
    "a token signed by another key",
    async () => `Bearer ${await mint(playerClaims(), { key: foreignKey.privateKey })}`,
  ],
  [
    "a legacy anon-key-shaped JWT",
    async () => `Bearer ${await mint({ iss: "supabase", ref: "stub", role: "anon" })}`,
  ],
  [
    "a project-issued token carrying role: anon",
    async () => `Bearer ${await mint(playerClaims({ role: "anon" }))}`,
  ],
  [
    "a role: service_role token",
    async () => `Bearer ${await mint(playerClaims({ role: "service_role" }))}`,
  ],
  [
    "a token from another project",
    async () => `Bearer ${await mint(playerClaims({ iss: "https://other.supabase.co/auth/v1" }))}`,
  ],
  [
    "a token minted for another audience",
    async () => `Bearer ${await mint(playerClaims({ aud: "admin" }))}`,
  ],
  [
    "a token without a subject",
    async () => `Bearer ${await mint(playerClaims({ sub: undefined }))}`,
  ],
];

@Controller("guarded/me")
@UseGuards(SupabaseUserGuard)
class GuardedMeController {
  @Get()
  me(@Req() request: AuthedRequest): AuthedUser {
    return request.user;
  }
}

@Controller("guarded/editor")
@UseGuards(EditorGuard)
class GuardedEditorController {
  @Get()
  editor(@Req() request: AuthedRequest): AuthedUser {
    return request.user;
  }
}

describe("auth guards e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let supabaseCalls: string[] = [];
  let realFetch: typeof globalThis.fetch;

  beforeAll(async () => {
    signingKey = await generateKeyPair("ES256", { extractable: true });
    foreignKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };

    // The point of local verification: nothing may leave for the Auth server while a request is served.
    realFetch = globalThis.fetch;
    globalThis.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      if (url.includes("stub.supabase.co")) {
        supabaseCalls.push(url);
      }
      return realFetch(input, init);
    };

    const moduleRef = await Test.createTestingModule({
      imports: [RootModule],
      controllers: [GuardedMeController, GuardedEditorController],
    })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(JWKS)
      .useValue(createLocalJWKSet({ keys: [publicJwk] }))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    globalThis.fetch = realFetch;
    await app.close();
  });

  beforeEach(() => {
    supabaseCalls = [];
  });

  it("GET a guarded route without a token → 401 UNAUTHENTICATED envelope", async () => {
    const response = await fetch(`${baseUrl}/guarded/me`);
    expect(response.status).toBe(401);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("UNAUTHENTICATED");
    expect(body.error).toBe("Unauthorized");
  });

  it.each(rejected)(
    "GET a guarded route with %s → 401 UNAUTHENTICATED",
    async (_name, authorization) => {
      const response = await fetch(`${baseUrl}/guarded/me`, {
        headers: { Authorization: await authorization() },
      });
      expect(response.status).toBe(401);
      expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    },
  );

  it("GET /guarded/me with a player token exposes the verified sub and email", async () => {
    const response = await fetch(`${baseUrl}/guarded/me`, {
      headers: { Authorization: `Bearer ${await mint(playerClaims())}` },
    });
    expect(response.status).toBe(200);
    const user = (await response.json()) as AuthedUser;
    expect(user.id).toBe(PLAYER_ID);
    expect(user.email).toBe("player@mentis.test");
    expect(user.claims.role).toBe("authenticated");
    expect(supabaseCalls).toEqual([]);
  });

  it("GET an editor route with a player token → 403 FORBIDDEN envelope", async () => {
    const response = await fetch(`${baseUrl}/guarded/editor`, {
      headers: { Authorization: `Bearer ${await mint(playerClaims())}` },
    });
    expect(response.status).toBe(403);
    const body = errorResponseSchema.parse(await response.json());
    expect(body.code).toBe("FORBIDDEN");
    expect(body.error).toBe("Forbidden");
  });

  it("GET an editor route with the editor claim in user_metadata → 403 FORBIDDEN", async () => {
    const forged = await mint(playerClaims({ user_metadata: { role: "editor" } }));
    const response = await fetch(`${baseUrl}/guarded/editor`, {
      headers: { Authorization: `Bearer ${forged}` },
    });
    expect(response.status).toBe(403);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("FORBIDDEN");
  });

  it("GET an editor route with an editor token passes both gates", async () => {
    const response = await fetch(`${baseUrl}/guarded/editor`, {
      headers: { Authorization: `Bearer ${await mint(editorClaims())}` },
    });
    expect(response.status).toBe(200);
    const user = (await response.json()) as AuthedUser;
    expect(user.id).toBe(EDITOR_ID);
    expect(supabaseCalls).toEqual([]);
  });

  it("GET an editor route without a token → 401, not 403", async () => {
    const response = await fetch(`${baseUrl}/guarded/editor`);
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });
});
