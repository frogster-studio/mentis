import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";

@Injectable()
export class PremiumRepository {
  constructor(
    @InjectRepository(PremiumEntitlementEntity)
    private readonly entitlements: Repository<PremiumEntitlementEntity>,
  ) {}

  findByOwner(owner: string): Promise<PremiumEntitlementEntity | null> {
    return this.entitlements.findOne({ where: { owner } });
  }
}
