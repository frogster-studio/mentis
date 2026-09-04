import { Inject, Injectable } from "@nestjs/common";
import { REVENUECAT, type RevenueCatClient } from "../../_config/revenuecat.config";
import { PremiumRepository } from "../repositories/premium.repository";
import { parseWebhookDelivery } from "../utils/parse-webhook-delivery";
import { toEntitlementSnapshot } from "../utils/to-entitlement-snapshot";
import { toPremiumEntitlementId } from "../utils/to-premium-entitlement-id";

@Injectable()
export class RevenueCatResyncService {
  constructor(
    @Inject(REVENUECAT) private readonly revenueCat: RevenueCatClient,
    private readonly premiumRepository: PremiumRepository,
  ) {}

  // ADR 0006: the delivery only triggers a re-fetch; RevenueCat's current entitlements win.
  async handleDelivery(body: unknown): Promise<void> {
    const { ownerIds, environment } = parseWebhookDelivery(body);
    if (ownerIds.length === 0) {
      return;
    }

    const premiumEntitlementId = toPremiumEntitlementId(await this.revenueCat.fetchEntitlements());
    for (const owner of ownerIds) {
      const active = await this.revenueCat.fetchActiveEntitlements(owner);
      const snapshot = toEntitlementSnapshot(active, premiumEntitlementId, environment);
      await this.premiumRepository.upsertByOwner(owner, snapshot);
    }
  }
}
