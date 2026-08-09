import { Module } from "@nestjs/common";
import { CardsController } from "./cards.controller";
import { CardsService } from "./cards.service";

// The /admin/* surface: consumed only by the Next BFF, editor-gated (#7).
@Module({
  controllers: [CardsController],
  providers: [CardsService],
})
export class AdminModule {}
