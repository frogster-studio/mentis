import type { Repository } from "typeorm";
import { describe, expect, it, type Mock, vi } from "vitest";
import type { QuestionEntity } from "../../_database/entities/question.entity";
import type { ThemeEntity } from "../../_database/entities/theme.entity";
import { CatalogRepository } from "../repositories/catalog.repository";

const SERVABLE_SQL = "SELECT servable";
const SERVABLE_PARAMETERS = { servable: true };

const DRAWN_ROW = {
  id: "q1",
  themeId: "les-simpson",
  themeName: "Les Simpson",
  text: "q1 ?",
  answer: "42",
  aliases: [],
  misspellings: [],
  wrongChoices: ["1", "2", "3"],
  categoryId: "television",
  categoryName: "Télévision",
  categoryColor: "#8e24aa",
  categorySecondaryColor: "#f3e5f5",
  categoryIcon: "tv",
};

const CHAINED = [
  "innerJoin",
  "select",
  "addSelect",
  "where",
  "andWhere",
  "distinctOn",
  "orderBy",
  "addOrderBy",
  "from",
  "setParameters",
  "limit",
] as const;

const builderMock = () => ({
  ...(Object.fromEntries(CHAINED.map((method) => [method, vi.fn().mockReturnThis()])) as Record<
    (typeof CHAINED)[number],
    Mock
  >),
  getQuery: vi.fn().mockReturnValue(SERVABLE_SQL),
  getParameters: vi.fn().mockReturnValue(SERVABLE_PARAMETERS),
  getRawMany: vi.fn().mockResolvedValue([DRAWN_ROW]),
});

function repositoryHarness() {
  const servable = builderMock();
  const drawn = builderMock();
  const questions = {
    createQueryBuilder: vi.fn().mockReturnValue(servable),
    manager: { createQueryBuilder: vi.fn().mockReturnValue(drawn) },
  };
  const repository = new CatalogRepository(
    {} as Repository<ThemeEntity>,
    questions as unknown as Repository<QuestionEntity>,
  );
  return { repository, questions, servable, drawn };
}

describe("CatalogRepository.drawRandomQuestions", () => {
  it("without a Theme keeps one random Ready Question per Published Theme, then orders at random and limits", async () => {
    const { repository, servable, drawn } = repositoryHarness();

    await repository.drawRandomQuestions(null, 3);

    expect(servable.where).toHaveBeenCalledWith("theme.published = true");
    expect(servable.andWhere).toHaveBeenCalledWith("question.readyToBePublished = true");
    expect(servable.andWhere).toHaveBeenCalledTimes(1);
    expect(servable.distinctOn).toHaveBeenCalledWith(["question.themeId"]);
    expect(servable.orderBy).toHaveBeenCalledWith("question.themeId");
    expect(servable.addOrderBy).toHaveBeenCalledWith("random()");
    expect(servable.limit).not.toHaveBeenCalled();
    expect(drawn.select).toHaveBeenCalledWith("drawn.*");
    expect(drawn.from).toHaveBeenCalledWith(`(${SERVABLE_SQL})`, "drawn");
    expect(drawn.setParameters).toHaveBeenCalledWith(SERVABLE_PARAMETERS);
    expect(drawn.orderBy).toHaveBeenCalledWith("random()");
    expect(drawn.limit).toHaveBeenCalledWith(3);
  });

  it("with a Theme draws at random from that Theme alone, one query, no per-Theme pick", async () => {
    const { repository, questions, servable } = repositoryHarness();

    await repository.drawRandomQuestions("les-simpson", 2);

    expect(servable.where).toHaveBeenCalledWith("theme.published = true");
    expect(servable.andWhere).toHaveBeenNthCalledWith(1, "question.readyToBePublished = true");
    expect(servable.andWhere).toHaveBeenNthCalledWith(2, "question.themeId = :themeId", {
      themeId: "les-simpson",
    });
    expect(servable.distinctOn).not.toHaveBeenCalled();
    expect(servable.addOrderBy).not.toHaveBeenCalled();
    expect(servable.orderBy).toHaveBeenCalledWith("random()");
    expect(servable.limit).toHaveBeenCalledWith(2);
    expect(questions.manager.createQueryBuilder).not.toHaveBeenCalled();
  });

  it.each([null, "les-simpson"])(
    "nests the drawn row's Category columns into its category (theme %s)",
    async (themeId) => {
      const { repository } = repositoryHarness();

      await expect(repository.drawRandomQuestions(themeId, 1)).resolves.toEqual([
        {
          id: "q1",
          themeId: "les-simpson",
          themeName: "Les Simpson",
          text: "q1 ?",
          answer: "42",
          aliases: [],
          misspellings: [],
          wrongChoices: ["1", "2", "3"],
          category: {
            id: "television",
            name: "Télévision",
            color: "#8e24aa",
            secondaryColor: "#f3e5f5",
            icon: "tv",
          },
        },
      ]);
    },
  );
});
