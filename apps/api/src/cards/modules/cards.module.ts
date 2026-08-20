import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CardEntity } from "../../_database/entities/card.entity";
import { AdminCardImagesController } from "../controllers/admin-card-images.controller";
import { AdminCardsController } from "../controllers/admin-cards.controller";
import { CardsRepository } from "../repositories/cards.repository";
import { CardImageStorage } from "../services/card-image-storage";
import { CardsService } from "../services/cards.service";

// Card curation — the /admin surface, EditorGuard-bound on every route.
@Module({
  imports: [TypeOrmModule.forFeature([CardEntity])],
  controllers: [AdminCardImagesController, AdminCardsController],
  providers: [CardImageStorage, CardsRepository, CardsService],
})
export class CardsModule {}
