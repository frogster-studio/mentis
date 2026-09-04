import type { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import type { RevenueCatActiveEntitlementList } from "../../_config/revenuecat.config";
import type { EntitlementSnapshot } from "../types/entitlement-snapshot";

// Grace-extended entitlements already carry a future expires_at, so no branch is needed here.
export const toEntitlementSnapshot = (
  activeEntitlements: RevenueCatActiveEntitlementList,
  premiumEntitlementId: string,
  environment: PremiumEnvironmentEnum | null,
): EntitlementSnapshot => {
  const premium = (activeEntitlements.items ?? []).find(
    (item) => item?.entitlement_id === premiumEntitlementId,
  );
  const expiresAt = premium?.expires_at;
  const premiumUntil = typeof expiresAt === "number" ? new Date(expiresAt) : null;
  // The entity's invariant: environment is null whenever premium_until is (nothing to attribute).
  return { premiumUntil, environment: premiumUntil === null ? null : environment };
};
