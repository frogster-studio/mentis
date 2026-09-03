import { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import { describe, expect, it } from "vitest";
import type { RevenueCatSubscriber } from "../../_config/revenuecat.config";
import { toEntitlementSnapshot } from "../utils/to-entitlement-snapshot";

const subscriberWith = (expires: string | null): RevenueCatSubscriber => ({
  entitlements: { premium: { expires_date: expires } },
});

describe("toEntitlementSnapshot", () => {
  it("maps a future premium expiry to a Date and echoes the environment", () => {
    const snapshot = toEntitlementSnapshot(
      subscriberWith("2027-01-01T00:00:00Z"),
      PremiumEnvironmentEnum.PRODUCTION,
    );
    expect(snapshot.premiumUntil).toEqual(new Date("2027-01-01T00:00:00Z"));
    expect(snapshot.environment).toBe(PremiumEnvironmentEnum.PRODUCTION);
  });

  it("maps an absent premium entitlement to a null premiumUntil and null environment", () => {
    expect(toEntitlementSnapshot({ entitlements: {} }, PremiumEnvironmentEnum.SANDBOX)).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });

  it("maps a missing entitlements map to a null premiumUntil and null environment", () => {
    expect(toEntitlementSnapshot({}, PremiumEnvironmentEnum.PRODUCTION)).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });

  it("keeps a grace-period expiry — RevenueCat already extended it, so the mapper reads it as-is", () => {
    const graceExpiry = "2027-02-01T00:00:00Z";
    expect(
      toEntitlementSnapshot(subscriberWith(graceExpiry), PremiumEnvironmentEnum.PRODUCTION)
        .premiumUntil,
    ).toEqual(new Date(graceExpiry));
  });

  it("maps a null expires_date to a null premiumUntil and null environment", () => {
    expect(toEntitlementSnapshot(subscriberWith(null), PremiumEnvironmentEnum.SANDBOX)).toEqual({
      premiumUntil: null,
      environment: null,
    });
  });
});
