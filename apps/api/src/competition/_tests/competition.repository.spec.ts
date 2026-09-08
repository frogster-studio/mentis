import { Between, type EntityManager, type Repository } from "typeorm";
import { describe, expect, it, vi } from "vitest";
import { CompetitionAnswerEntity } from "../../_database/entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../../_database/entities/competition-attempt.entity";
import { CompetitionStandingEntity } from "../../_database/entities/competition-standing.entity";
import { CompetitionRepository } from "../repositories/competition.repository";
import type { FinalizedOutcome } from "../types/finalized-outcome";

const ATTEMPT = Object.assign(new CompetitionAttemptEntity(), {
  id: "30000000-0000-4000-8000-000000000001",
  owner: "11111111-1111-4111-8111-111111111111",
  day: "2026-07-31",
  status: "finalized",
  score: 30,
});
const OUTCOME: FinalizedOutcome = { reason: "quit", score: 30, answers: [] };

function repositoryHarness() {
  const claim = {
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ affected: 1 }),
  };
  const answers = {
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({}),
  };
  const standing = {
    insert: vi.fn().mockReturnThis(),
    into: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    orIgnore: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({}),
  };
  const manager = {
    createQueryBuilder: vi
      .fn()
      .mockReturnValueOnce(claim)
      .mockReturnValueOnce(answers)
      .mockReturnValueOnce(standing),
    findOneByOrFail: vi.fn().mockResolvedValue(ATTEMPT),
    findOneOrFail: vi.fn().mockResolvedValue({}),
    find: vi
      .fn()
      .mockResolvedValue([
        ATTEMPT,
        { day: "2026-07-31", score: 20 },
        { day: "2026-07-01", score: 10 },
      ]),
    upsert: vi.fn().mockResolvedValue({}),
  };
  const transaction = vi.fn(
    async (_isolation: string, work: (manager: EntityManager) => Promise<unknown>) =>
      work(manager as unknown as EntityManager),
  );
  const repository = new CompetitionRepository(
    { manager: { transaction } } as unknown as Repository<CompetitionAttemptEntity>,
    {} as Repository<CompetitionAnswerEntity>,
  );
  return { repository, transaction, manager, claim, answers, standing };
}

describe("CompetitionRepository.finalize", () => {
  it("upserts the recomputed total using the claimed Attempt's owner and Season in the transaction", async () => {
    const { repository, manager, transaction, standing, answers } = repositoryHarness();

    await expect(repository.finalize(ATTEMPT.id, OUTCOME)).resolves.toBe(ATTEMPT);

    expect(transaction).toHaveBeenCalledWith("READ COMMITTED", expect.any(Function));
    expect(answers.into).toHaveBeenCalledWith(CompetitionAnswerEntity);
    expect(standing.into).toHaveBeenCalledWith(CompetitionStandingEntity);
    expect(standing.values).toHaveBeenCalledWith({
      owner: ATTEMPT.owner,
      season: "2026-07",
      total: 0,
    });
    expect(standing.orIgnore).toHaveBeenCalledOnce();
    expect(manager.find).toHaveBeenCalledWith(CompetitionAttemptEntity, {
      where: {
        owner: ATTEMPT.owner,
        status: "finalized",
        day: Between("2026-07-01", "2026-07-31"),
      },
    });
    expect(manager.upsert).toHaveBeenCalledWith(
      CompetitionStandingEntity,
      { owner: ATTEMPT.owner, season: "2026-07", total: 40 },
      ["owner", "season"],
    );
  });

  it("waits for the Season row lock before reading scores or writing the total", async () => {
    const { repository, manager } = repositoryHarness();
    let releaseLock: (value: unknown) => void = () => {};
    manager.findOneOrFail.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          releaseLock = resolve;
        }),
    );

    const pending = repository.finalize(ATTEMPT.id, OUTCOME);
    await vi.waitFor(() =>
      expect(manager.findOneOrFail).toHaveBeenCalledWith(CompetitionStandingEntity, {
        where: { owner: ATTEMPT.owner, season: "2026-07" },
        lock: { mode: "pessimistic_write" },
      }),
    );
    expect(manager.find).not.toHaveBeenCalled();
    expect(manager.upsert).not.toHaveBeenCalled();
    releaseLock({});
    await pending;
    expect(manager.upsert).toHaveBeenCalledOnce();
  });

  it("writes neither answers nor standings when another finalize won the claim", async () => {
    const { repository, claim, manager, answers, standing } = repositoryHarness();
    claim.execute.mockResolvedValueOnce({ affected: 0 });

    await expect(repository.finalize(ATTEMPT.id, OUTCOME)).resolves.toBeNull();

    expect(answers.execute).not.toHaveBeenCalled();
    expect(standing.execute).not.toHaveBeenCalled();
    expect(manager.upsert).not.toHaveBeenCalled();
  });

  it("lets a standings failure abort the finalize transaction", async () => {
    const { repository, manager, transaction } = repositoryHarness();
    const failure = new Error("standing write failed");
    manager.upsert.mockRejectedValueOnce(failure);

    await expect(repository.finalize(ATTEMPT.id, OUTCOME)).rejects.toBe(failure);
    await expect(transaction.mock.results[0].value).rejects.toBe(failure);
  });
});
