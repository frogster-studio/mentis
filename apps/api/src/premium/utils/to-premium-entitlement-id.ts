import type { RevenueCatEntitlementList } from "../../_config/revenuecat.config";

const PREMIUM_LOOKUP_KEY = "premium";

// v2 names a customer's entitlements by opaque id, so `premium` has to be resolved to one.
export const toPremiumEntitlementId = (entitlements: RevenueCatEntitlementList): string => {
  const premium = (entitlements.items ?? []).find(
    (entitlement) => entitlement?.lookup_key === PREMIUM_LOOKUP_KEY,
  );
  if (typeof premium?.id !== "string") {
    // A project with no `premium` entitlement is broken configuration, never a free Player.
    throw new Error(`RevenueCat has no entitlement with the lookup key ${PREMIUM_LOOKUP_KEY}`);
  }
  return premium.id;
};
