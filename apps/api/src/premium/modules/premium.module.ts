import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";
import { PremiumController } from "../controllers/premium.controller";
import { RevenueCatWebhookController } from "../controllers/revenuecat-webhook.controller";
import { PremiumRepository } from "../repositories/premium.repository";
import { PremiumService } from "../services/premium.service";
import { RevenueCatResyncService } from "../services/revenuecat-resync.service";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PremiumEntitlementEntity])],
  controllers: [PremiumController, RevenueCatWebhookController],
  providers: [PremiumRepository, PremiumService, RevenueCatResyncService],
  exports: [PremiumService],
})
export class PremiumModule {}
