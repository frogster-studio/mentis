import { ConflictException } from "@nestjs/common";
import type { Repository } from "typeorm";
import { beforeEach, expect, it, vi } from "vitest";
import { CategoryEntity } from "../../_database/entities/category.entity";
import { QuestionEntity } from "../../_database/entities/question.entity";
import { ThemeEntity } from "../../_database/entities/theme.entity";
import { CurationRepository } from "../repositories/curation.repository";

const updatedAt = new Date("2026-09-01T00:00:00Z");
const stored = Object.assign(new ThemeEntity(), {
  id: "theme",
  image: "old.webp",
  categoryId: "category",
  updatedAt,
});
const themes = { findOne: vi.fn(), merge: vi.fn(), save: vi.fn() };
const manager = { getRepository: vi.fn(() => themes) };
const transaction = vi.fn(async (run: (value: typeof manager) => unknown) => run(manager));
let repository: CurationRepository;

beforeEach(() => {
  vi.clearAllMocks();
  themes.findOne.mockResolvedValue({ ...stored });
  themes.merge.mockImplementation((row, patch) => ({ ...row, ...patch }));
  themes.save.mockImplementation(async (row) => row);
  repository = new CurationRepository(
    { existsBy: async () => true } as unknown as Repository<CategoryEntity>,
    { manager: { transaction } } as unknown as Repository<ThemeEntity>,
    {} as Repository<QuestionEntity>,
  );
});

it("locks the row while comparing and replacing the image reference", async () => {
  const result = await repository.updateTheme({ id: "theme", image: "new.webp" }, stored);
  expect(result?.image).toBe("new.webp");
  expect(transaction).toHaveBeenCalledOnce();
  expect(themes.findOne).toHaveBeenCalledWith({
    where: { id: "theme" },
    lock: { mode: "pessimistic_write" },
  });
  expect(themes.save).toHaveBeenCalledOnce();
});

it("refuses a stale image without writing", async () => {
  await expect(
    repository.updateTheme(
      { id: "theme", image: "new.webp" },
      Object.assign(new ThemeEntity(), stored, { image: "outdated.webp" }),
    ),
  ).rejects.toThrow(ConflictException);
  expect(themes.save).not.toHaveBeenCalled();
});

it("refuses a changed version even if the image path has returned to the old value", async () => {
  await expect(
    repository.updateTheme(
      { id: "theme", image: "new.webp" },
      Object.assign(new ThemeEntity(), stored, { updatedAt: new Date("2026-08-01T00:00:00Z") }),
    ),
  ).rejects.toThrow(ConflictException);
  expect(themes.save).not.toHaveBeenCalled();
});
