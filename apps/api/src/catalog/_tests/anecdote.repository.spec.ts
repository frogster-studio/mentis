import type { Repository } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { AnecdoteEntity } from "../../_database/entities/anecdote.entity";
import { AnecdoteRepository } from "../repositories/anecdote.repository";

const ANECDOTE = Object.assign(new AnecdoteEntity(), {
  id: "40000000-0000-4000-8000-000000000001",
  text: "Le **miel** ne se périme jamais.",
});

function repositoryHarness() {
  const builder = {
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    getMany: vi.fn().mockResolvedValue([ANECDOTE]),
  };
  const anecdotes = { createQueryBuilder: vi.fn().mockReturnValue(builder) };
  const repository = new AnecdoteRepository(anecdotes as unknown as Repository<AnecdoteEntity>);
  return { repository, builder };
}

describe("AnecdoteRepository.drawRandomAnecdotes", () => {
  it("orders the whole table by random() and keeps the first n rows", async () => {
    const { repository, builder } = repositoryHarness();

    await expect(repository.drawRandomAnecdotes(3)).resolves.toEqual([ANECDOTE]);

    expect(builder.orderBy).toHaveBeenCalledWith("random()");
    expect(builder.limit).toHaveBeenCalledWith(3);
    expect(builder.getMany).toHaveBeenCalledOnce();
  });
});
