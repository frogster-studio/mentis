import {
  type AppAnecdoteDrawQuery,
  type AppAnecdoteDrawResponse,
  appAnecdoteDrawQuerySchema,
} from "@mentis/contracts/app";
import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { DrawThrottlerGuard } from "../../common/rate-limit.guard";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { AnecdoteService } from "../services/anecdote.service";

@Controller("app/anecdotes")
@UseGuards(DrawThrottlerGuard)
export class AnecdotesController {
  constructor(private readonly anecdoteService: AnecdoteService) {}

  @Get()
  draw(
    @Query(new ZodValidationPipe(appAnecdoteDrawQuerySchema)) query: AppAnecdoteDrawQuery,
  ): Promise<AppAnecdoteDrawResponse> {
    return this.anecdoteService.drawAnecdotes(query);
  }
}
