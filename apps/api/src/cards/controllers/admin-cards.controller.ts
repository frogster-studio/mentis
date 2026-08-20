import {
  type AdminCardListQuery,
  type AdminCardListResponse,
  type AdminCardPostedInput,
  type AdminCardResponse,
  type AdminCardWriteInput,
  adminCardListQuerySchema,
  adminCardPostedInputSchema,
  adminCardWriteInputSchema,
} from "@mentis/contracts/admin";
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { EditorGuard } from "../../auth/editor.guard";
import { AuthenticatedThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { CardsService } from "../services/cards.service";

@Controller("admin/cards")
@UseGuards(EditorGuard, AuthenticatedThrottlerGuard)
export class AdminCardsController {
  constructor(private readonly cardsService: CardsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminCardListQuerySchema)) query: AdminCardListQuery,
  ): Promise<AdminCardListResponse> {
    return this.cardsService.list(query);
  }

  @Post()
  create(
    @Body(new ZodValidationPipe(adminCardWriteInputSchema)) input: AdminCardWriteInput,
  ): Promise<AdminCardResponse> {
    return this.cardsService.create(input);
  }

  @Get(":id")
  get(@Param("id") id: string): Promise<AdminCardResponse> {
    return this.cardsService.get(id);
  }

  @Put(":id")
  replace(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminCardWriteInputSchema)) input: AdminCardWriteInput,
  ): Promise<AdminCardResponse> {
    return this.cardsService.replace(id, input);
  }

  @Patch(":id/posted")
  setPosted(
    @Param("id") id: string,
    @Body(new ZodValidationPipe(adminCardPostedInputSchema)) input: AdminCardPostedInput,
  ): Promise<AdminCardResponse> {
    return this.cardsService.setPosted(id, input);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("id") id: string): Promise<void> {
    await this.cardsService.remove(id);
  }
}
