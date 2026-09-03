import type { PremiumEnvironmentEnum } from "@mentis/contracts/enums";

export interface EntitlementSnapshot {
  premiumUntil: Date | null;
  environment: PremiumEnvironmentEnum | null;
}
