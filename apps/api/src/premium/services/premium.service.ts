import { type AppPremiumResponse, appPremiumResponseSchema } from "@mentis/contracts/app";
import { Injectable } from "@nestjs/common";
import { PremiumRepository } from "../repositories/premium.repository";

@Injectable()
export class PremiumService {
  constructor(private readonly premiumRepository: PremiumRepository) {}

  async read(owner: string): Promise<AppPremiumResponse> {
    const until = await this.activeUntil(owner);
    return appPremiumResponseSchema.parse({
      active: until !== null,
      until: until === null ? null : until.toISOString(),
    });
  }

  // The gate every premium action shares: evaluated at the moment of the action, never cached.
  async isActive(owner: string): Promise<boolean> {
    return (await this.activeUntil(owner)) !== null;
  }

  // ADR 0006: a local premium_until > now compare, never a RevenueCat call.
  private async activeUntil(owner: string): Promise<Date | null> {
    const row = await this.premiumRepository.findByOwner(owner);
    const until = row?.premiumUntil ?? null;
    return until !== null && until.getTime() > Date.now() ? until : null;
  }
}
