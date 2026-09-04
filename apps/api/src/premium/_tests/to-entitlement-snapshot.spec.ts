import { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import type { RevenueCatActiveEntitlementList } from "../../_config/revenuecat.config";
import { toEntitlementSnapshot } from "../utils/to-entitlement-snapshot";

const PREMIUM_ID = "entl43b2c0b2fa";

const activeWith = (expiresAt: number | null): RevenueCatActiveEntitlementList => ({
  items: [{ entitlement_id: PREMIUM_ID, expires_at: expiresAt }],
});

const FUTURE = new Date("2027-01-01T00:00:00.000Z");

describe("toEntitlementSnapshot", () => {
  it("maps a future premium expiry to a Date and echoes the environment", () => {
    const snapshot = toEntitlementSnapshot(
      activeWith(FUTURE.getTime()),
      PREMIUM_ID,
      PremiumEnvironmentEnum.PRODUCTION,
    );
    expect(snapshot.premiumUntil).toEqual(FUTURE);
    expect(snapshot.environment).toBe(PremiumEnvironmentEnum.PRODUCTION);
  });

  it("ignores an active entitlement that is not premium", () => {
    expect(
      toEntitlementSnapshot(
        { items: [{ entitlement_id: "entl0000other", expires_at: FUTURE.getTime() }] },
        PREMIUM_ID,
        PremiumEnvironmentEnum.PRODUCTION,
      ),
    ).toEqual({ premiumUntil: null, environment: null });
  });

  it("maps an absent premium entitlement to a null premiumUntil and null environment", () => {
    expect(
      toEntitlementSnapshot({ items: [] }, PREMIUM_ID, PremiumEnvironmentEnum.SANDBOX),
    ).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });

  it("maps a missing items list to a null premiumUntil and null environment", () => {
    expect(toEntitlementSnapshot({}, PREMIUM_ID, PremiumEnvironmentEnum.PRODUCTION)).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });

  it("keeps a grace-period expiry — RevenueCat already extended it, so the mapper reads it as-is", () => {
    const graceExpiry = new Date("2027-02-01T00:00:00.000Z");
    expect(
      toEntitlementSnapshot(
        activeWith(graceExpiry.getTime()),
        PREMIUM_ID,
        PremiumEnvironmentEnum.PRODUCTION,
      ).premiumUntil,
    ).toEqual(graceExpiry);
  });

  it("maps a null expires_at to a null premiumUntil and null environment", () => {
    expect(
      toEntitlementSnapshot(activeWith(null), PREMIUM_ID, PremiumEnvironmentEnum.SANDBOX),
    ).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });
});
