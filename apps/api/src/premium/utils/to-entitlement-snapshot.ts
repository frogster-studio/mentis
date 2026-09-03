import type { PremiumEnvironmentEnum } from "@mentis/contracts/enums";
import type { RevenueCatSubscriber } from "../../_config/revenuecat.config";
import type { EntitlementSnapshot } from "../types/entitlement-snapshot";

// Grace-extended entitlements already carry a future expires_date, so no branch is needed here.
export const toEntitlementSnapshot = (
  subscriber: RevenueCatSubscriber,
  environment: PremiumEnvironmentEnum | null,
): EntitlementSnapshot => {
  const expires = subscriber.entitlements?.premium?.expires_date;
  const premiumUntil = typeof expires === "string" ? new Date(expires) : null;
  // The entity's invariant: environment is null whenever premium_until is (nothing to attribute).
  return { premiumUntil, environment: premiumUntil === null ? null : environment };
};
