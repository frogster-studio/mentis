import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";

@Injectable()
export class AnecdoteRepository {
  constructor(
    @InjectRepository(AnecdoteEntity) private readonly anecdotes: Repository<AnecdoteEntity>,
  ) {}

  drawRandomAnecdotes(count: number): Promise<AnecdoteEntity[]> {
    return this.anecdotes.createQueryBuilder("anecdote").orderBy("random()").limit(count).getMany();
  }
}
