import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";
import type { EntitlementSnapshot } from "../types/entitlement-snapshot";

@Injectable()
export class PremiumRepository {
  constructor(
    @InjectRepository(PremiumEntitlementEntity)
    private readonly entitlements: Repository<PremiumEntitlementEntity>,
  ) {}

  findByOwner(owner: string): Promise<PremiumEntitlementEntity | null> {
    return this.entitlements.findOne({ where: { owner } });
  }

  // One row per owner, so a re-sync overwrites current truth in a single query.
  async upsertByOwner(owner: string, snapshot: EntitlementSnapshot): Promise<void> {
    await this.entitlements.upsert(
      { owner, premiumUntil: snapshot.premiumUntil, environment: snapshot.environment },
      { conflictPaths: ["owner"] },
    );
  }
}
