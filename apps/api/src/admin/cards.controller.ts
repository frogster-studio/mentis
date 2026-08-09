import {
  type AdminCardListQuery,
  type AdminCardListResponse,
  adminCardListQuerySchema,
} from "@mentis/contracts/admin";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { EditorGuard } from "../auth/editor.guard";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CardsService } from "./cards.service";

@Controller("admin/cards")
@UseGuards(EditorGuard)
export class CardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminCardListQuerySchema)) query: AdminCardListQuery,
  ): Promise<AdminCardListResponse> {
    return this.cardsService.list(query);
  }
}
