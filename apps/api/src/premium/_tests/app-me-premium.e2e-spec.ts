import { appPremiumResponseSchema } from "@mentis/contracts/app";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { createLocalJWKSet, exportJWK, generateKeyPair, type JWTPayload, SignJWT } from "jose";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ENV } from "../../_config/env.config";
import { SUPABASE } from "../../_config/supabase.config";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import { PremiumRepository } from "../repositories/premium.repository";

const PLAYER_A = "11111111-1111-4111-8111-111111111111";
const PLAYER_B = "22222222-2222-4222-8222-222222222222";
const ROW_ID = "e0000000-0000-4000-8000-000000000001";

let entitlements: Map<string, PremiumEntitlementEntity>;

const entitlementRow = (
  owner: string,
  overrides: Partial<PremiumEntitlementEntity> = {},
): PremiumEntitlementEntity =>
  Object.assign(new PremiumEntitlementEntity(), {
    id: ROW_ID,
    owner,
    premiumUntil: null,
    environment: null,
    ...overrides,
  });

const fakePremiumRepository = {
  async findByOwner(owner) {
    return entitlements.get(owner) ?? null;
  },
} satisfies Pick<PremiumRepository, "findByOwner">;

describe("app me premium routes e2e", () => {
  let app: INestApplication;
  let baseUrl: string;
  let tokenA: string;

  const authed = (token: string, path: string) =>
    fetch(`${baseUrl}${path}`, { headers: { Authorization: `Bearer ${token}` } });

  beforeAll(async () => {
    const signingKey = await generateKeyPair("ES256", { extractable: true });
    const publicJwk = { ...(await exportJWK(signingKey.publicKey)), alg: "ES256", kid: "test-key" };
    tokenA = await new SignJWT({
      iss: `${testEnv.SUPABASE_URL}/auth/v1`,
      aud: "authenticated",
      sub: PLAYER_A,
      role: "authenticated",
    } satisfies JWTPayload)
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(signingKey.privateKey);

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(PremiumRepository)
      .useValue(fakePremiumRepository)
      .overrideProvider(SUPABASE)
      .useValue({})
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

  beforeEach(() => {
    entitlements = new Map();
  });

  it("GET /app/me/premium without a token → 401 UNAUTHENTICATED", async () => {
    const response = await fetch(`${baseUrl}/app/me/premium`);
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
  });

  it("with no row → inactive, until null", async () => {
    const response = await authed(tokenA, "/app/me/premium");
    expect(response.status).toBe(200);
    expect(appPremiumResponseSchema.parse(await response.json())).toEqual({
      active: false,
      until: null,
    });
  });

  it("with a future expiry → active, until echoes the ISO date", async () => {
    const future = new Date(Date.now() + 60 * 60 * 1000);
    entitlements.set(
      PLAYER_A,
      entitlementRow(PLAYER_A, { premiumUntil: future, environment: "SANDBOX" }),
    );

    const response = await authed(tokenA, "/app/me/premium");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ active: true, until: future.toISOString() });
  });

  it("with a past expiry → inactive, until null", async () => {
    entitlements.set(
      PLAYER_A,
      entitlementRow(PLAYER_A, {
        premiumUntil: new Date(Date.now() - 60 * 60 * 1000),
        environment: "PRODUCTION",
      }),
    );

    const response = await authed(tokenA, "/app/me/premium");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ active: false, until: null });
  });

  it("never leaks another Player's premium row", async () => {
    entitlements.set(
      PLAYER_B,
      entitlementRow(PLAYER_B, {
        premiumUntil: new Date(Date.now() + 60 * 60 * 1000),
        environment: "PRODUCTION",
      }),
    );

    const response = await authed(tokenA, "/app/me/premium");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ active: false, until: null });
  });
});
