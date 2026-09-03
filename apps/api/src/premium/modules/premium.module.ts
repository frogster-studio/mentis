import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "../../_config/config.module";
import { PremiumEntitlementEntity } from "../../_database/entities/premium-entitlement.entity";
import { PremiumController } from "../controllers/premium.controller";
import { PremiumRepository } from "../repositories/premium.repository";
import { PremiumService } from "../services/premium.service";

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([PremiumEntitlementEntity])],
  controllers: [PremiumController],
  providers: [PremiumRepository, PremiumService],
})
export class PremiumModule {}
