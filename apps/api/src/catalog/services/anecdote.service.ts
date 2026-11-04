import {
  type AppAnecdoteDrawQuery,
  type AppAnecdoteDrawResponse,
  appAnecdoteDrawResponseSchema,
} from "@mentis/contracts/app";
import { Injectable } from "@nestjs/common";
import { AnecdoteRepository } from "../repositories/anecdote.repository";

@Injectable()
export class AnecdoteService {
  constructor(private readonly anecdoteRepository: AnecdoteRepository) {}

  async drawAnecdotes(query: AppAnecdoteDrawQuery): Promise<AppAnecdoteDrawResponse> {
    const anecdotes = await this.anecdoteRepository.drawRandomAnecdotes(query.n);
    return appAnecdoteDrawResponseSchema.parse(anecdotes);
  }
}
