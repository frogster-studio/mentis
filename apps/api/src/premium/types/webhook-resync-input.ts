import type { PremiumEnvironmentEnum } from "@mentis/contracts/enums";

export interface WebhookResyncInput {
  ownerIds: string[];
  environment: PremiumEnvironmentEnum | null;
}
