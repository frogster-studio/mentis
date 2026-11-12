import {
  type AppAnecdoteDrawQuery,
  type AppAnecdoteDrawResponse,
  appAnecdoteDrawResponseSchema,
} from "@mentis/contracts/app";
import { Inject, Injectable } from "@nestjs/common";
import { ENV, type Env } from "../../_config/env.config";
import { AnecdoteRepository } from "../repositories/anecdote.repository";
import { anecdoteImageUrl } from "../utils/anecdote-image-url";

@Injectable()
export class AnecdoteService {
  constructor(
    private readonly anecdoteRepository: AnecdoteRepository,
    @Inject(ENV) private readonly env: Env,
  ) {}

  async drawAnecdotes(query: AppAnecdoteDrawQuery): Promise<AppAnecdoteDrawResponse> {
    const anecdotes = await this.anecdoteRepository.drawRandomAnecdotes(query.n);
    return appAnecdoteDrawResponseSchema.parse(
      anecdotes.map(({ id, text, image }) => ({
        id,
        text,
        imageUrl: image === null ? null : anecdoteImageUrl(this.env.SUPABASE_URL, image),
      })),
    );
  }
}
