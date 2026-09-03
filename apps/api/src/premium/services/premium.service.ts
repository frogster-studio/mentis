import { type AppPremiumResponse, appPremiumResponseSchema } from "@mentis/contracts/app";
import { Injectable } from "@nestjs/common";
import { PremiumRepository } from "../repositories/premium.repository";

@Injectable()
export class PremiumService {
  constructor(private readonly premiumRepository: PremiumRepository) {}

  /**
   * ADR 0006: this read is a local premium_until > now comparison, never a RevenueCat call.
   */
  async read(owner: string): Promise<AppPremiumResponse> {
    const row = await this.premiumRepository.findByOwner(owner);
    const until = row?.premiumUntil ?? null;

    const active = until !== null && until.getTime() > Date.now();

    return appPremiumResponseSchema.parse({
      active,
      until: active ? until.toISOString() : null,
    });
  }
}
