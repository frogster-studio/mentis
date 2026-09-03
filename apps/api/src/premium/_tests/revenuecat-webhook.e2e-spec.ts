import { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import { errorResponseSchema } from "@mentis/contracts/shared";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { getDataSourceToken } from "@nestjs/typeorm";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ENV } from "../../_config/env.config";
import { REVENUECAT, type RevenueCatSubscriber } from "../../_config/revenuecat.config";
import { SUPABASE } from "../../_config/supabase.config";
import { stubDataSource, testEnv } from "../../_tests/test-env";
import { AppModule } from "../../app.module";
import { JWKS } from "../../auth/jwks";
import { PremiumRepository } from "../repositories/premium.repository";
import type { EntitlementSnapshot } from "../types/entitlement-snapshot";

const OWNER_A = "11111111-1111-4111-8111-111111111111";
const OWNER_B = "22222222-2222-4222-8222-222222222222";

let mirror: Map<string, EntitlementSnapshot>;
let subscribers: Map<string, RevenueCatSubscriber>;
const fetchSubscriber = vi.fn(
  async (appUserId: string): Promise<RevenueCatSubscriber> =>
    subscribers.get(appUserId) ?? { entitlements: {} },
);

const fakePremiumRepository = {
  async upsertByOwner(owner: string, snapshot: EntitlementSnapshot) {
    mirror.set(owner, snapshot);
  },
} satisfies Pick<PremiumRepository, "upsertByOwner">;

describe("revenuecat webhook e2e", () => {
  let app: INestApplication;
  let baseUrl: string;

  const post = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${baseUrl}/revenuecat/webhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
    });

  const authorized = (body: unknown) =>
    post(body, { Authorization: testEnv.REVENUECAT_WEBHOOK_AUTH });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(ENV)
      .useValue(testEnv)
      .overrideProvider(getDataSourceToken())
      .useValue(stubDataSource)
      .overrideProvider(PremiumRepository)
      .useValue(fakePremiumRepository)
      .overrideProvider(REVENUECAT)
      .useValue({ fetchSubscriber })
      .overrideProvider(SUPABASE)
      .useValue({})
      .overrideProvider(JWKS)
      .useValue(() => Promise.reject(new Error("no jwt path here")))
      .compile();
    app = moduleRef.createNestApplication();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    mirror = new Map();
    subscribers = new Map();
    fetchSubscriber.mockClear();
  });

  it("without the Authorization header → 401 UNAUTHENTICATED", async () => {
    const response = await post({ event: { app_user_id: OWNER_A } });
    expect(response.status).toBe(401);
    expect(errorResponseSchema.parse(await response.json()).code).toBe("UNAUTHENTICATED");
    expect(fetchSubscriber).not.toHaveBeenCalled();
    expect(mirror.size).toBe(0);
  });

  it("with a wrong Authorization value → 401 UNAUTHENTICATED", async () => {
    const response = await post(
      { event: { app_user_id: OWNER_A } },
      { Authorization: "Bearer forged" },
    );
    expect(response.status).toBe(401);
    expect(fetchSubscriber).not.toHaveBeenCalled();
    expect(mirror.size).toBe(0);
  });

  it("with an Authorization of a different length → 401 UNAUTHENTICATED", async () => {
    const response = await post(
      { event: { app_user_id: OWNER_A } },
      { Authorization: `${testEnv.REVENUECAT_WEBHOOK_AUTH}-extra` },
    );
    expect(response.status).toBe(401);
    expect(fetchSubscriber).not.toHaveBeenCalled();
  });

  it("a valid INITIAL_PURCHASE resyncs the owner and overwrites the mirror row", async () => {
    const expires = "2027-01-01T00:00:00.000Z";
    subscribers.set(OWNER_A, { entitlements: { premium: { expires_date: expires } } });

    const response = await authorized({
      event: { type: "INITIAL_PURCHASE", app_user_id: OWNER_A, environment: "SANDBOX" },
    });
    expect(response.status).toBe(204);
    expect(fetchSubscriber).toHaveBeenCalledExactlyOnceWith(OWNER_A);
    expect(mirror.get(OWNER_A)).toEqual({
      premiumUntil: new Date(expires),
      environment: PremiumEnvironmentEnum.SANDBOX,
    });
  });

  it("a TRANSFER resyncs both sides — the loser's row nulls out (premium and environment)", async () => {
    const expires = "2027-01-01T00:00:00.000Z";
    subscribers.set(OWNER_A, { entitlements: {} });
    subscribers.set(OWNER_B, { entitlements: { premium: { expires_date: expires } } });

    const response = await authorized({
      event: {
        type: "TRANSFER",
        transferred_from: [OWNER_A],
        transferred_to: [OWNER_B],
        environment: "PRODUCTION",
      },
    });
    expect(response.status).toBe(204);
    expect(fetchSubscriber.mock.calls.map(([id]) => id).sort()).toEqual([OWNER_A, OWNER_B].sort());
    expect(mirror.get(OWNER_A)).toEqual({ premiumUntil: null, environment: null });
    expect(mirror.get(OWNER_B)).toEqual({
      premiumUntil: new Date(expires),
      environment: PremiumEnvironmentEnum.PRODUCTION,
    });
  });

  it("a malformed body is acknowledged and writes nothing", async () => {
    const response = await authorized({ garbage: "yes" });
    expect(response.status).toBe(204);
    expect(fetchSubscriber).not.toHaveBeenCalled();
    expect(mirror.size).toBe(0);
  });

  it("a forged body naming a non-UUID id is acknowledged and writes nothing", async () => {
    const response = await authorized({
      event: { app_user_id: "$RCAnonymousID:abc", environment: "SANDBOX" },
    });
    expect(response.status).toBe(204);
    expect(fetchSubscriber).not.toHaveBeenCalled();
    expect(mirror.size).toBe(0);
  });
});
