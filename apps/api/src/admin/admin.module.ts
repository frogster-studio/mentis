import { Module } from "@nestjs/common";
import { CardImagesController } from "./card-images.controller";
import { CardsController } from "./cards.controller";

// The /admin surface: EditorGuard-bound Card curation.
@Module({ controllers: [CardImagesController, CardsController] })
export class AdminModule {}
