import { getMetadataArgsStorage } from "typeorm";
import { describe, expect, it } from "vitest";
import { CompetitionAnswerEntity } from "../entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../entities/competition-attempt.entity";
import { StatBaselineEntity } from "../entities/stat-baseline.entity";
import { ThemeEntity } from "../entities/theme.entity";

// migration:generate drops from the database any constraint the entities stop declaring.
const uniqueColumnsOn = (entity: object) =>
  getMetadataArgsStorage()
    .uniques.filter((unique) => unique.target === entity)
    .flatMap((unique) => (Array.isArray(unique.columns) ? unique.columns : []));

const relationOn = (entity: object, propertyName: string) =>
  getMetadataArgsStorage().relations.find(
    (relation) => relation.target === entity && relation.propertyName === propertyName,
  );

describe("themes", () => {
  it("requires a category id on every row", () => {
    const categoryId = getMetadataArgsStorage().columns.find(
      (column) => column.target === ThemeEntity && column.propertyName === "categoryId",
    );
    expect(categoryId?.options.nullable).toBeFalsy();
  });

  it("belongs to exactly one Category, which cannot be deleted out from under it", () => {
    expect(relationOn(ThemeEntity, "category")?.options).toMatchObject({
      nullable: false,
      onDelete: "RESTRICT",
    });
  });
});

// These natural keys are what ON CONFLICT DO NOTHING fires on, so losing one silently duplicates rows.
describe("the natural keys behind every idempotent write", () => {
  it("holds one Attempt per owner, day and kind", () => {
    expect(uniqueColumnsOn(CompetitionAttemptEntity)).toEqual(["owner", "day", "kind"]);
  });

  it("holds one answer per Attempt position", () => {
    expect(uniqueColumnsOn(CompetitionAnswerEntity)).toEqual(["attemptId", "position"]);
  });

  it("holds one baseline per owner, device and Theme", () => {
    expect(uniqueColumnsOn(StatBaselineEntity)).toEqual(["owner", "device", "themeId"]);
  });
});
