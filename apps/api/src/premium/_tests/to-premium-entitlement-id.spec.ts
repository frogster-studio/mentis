import { describe, expect, it } from "vitest";
import { toPremiumEntitlementId } from "../utils/to-premium-entitlement-id";

const PREMIUM_ID = "entl43b2c0b2fa";

describe("toPremiumEntitlementId", () => {
  it("resolves the premium lookup key to the entitlement's opaque id", () => {
    expect(
      toPremiumEntitlementId({
        items: [
          { id: "entl0000other", lookup_key: "other" },
          { id: PREMIUM_ID, lookup_key: "premium" },
        ],
      }),
    ).toBe(PREMIUM_ID);
  });

  it("throws when the project has no premium entitlement — configuration, not a free Player", () => {
    expect(() =>
      toPremiumEntitlementId({ items: [{ id: "entl0000other", lookup_key: "other" }] }),
    ).toThrow();
  });

  it("throws when the entitlement list is missing", () => {
    expect(() => toPremiumEntitlementId({})).toThrow();
  });
});
