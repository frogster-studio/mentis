import { getMetadataArgsStorage } from "typeorm";
import { describe, expect, it } from "vitest";
import { CompetitionAnswerEntity } from "../entities/competition-answer.entity";
import { CompetitionAttemptEntity } from "../entities/competition-attempt.entity";
import { QuestionEntity } from "../entities/question.entity";
import { StatBaselineEntity } from "../entities/stat-baseline.entity";
import { ThemeEntity } from "../entities/theme.entity";

// migration:generate drops from the database any constraint the entities stop declaring.
const uniqueColumnsOn = (entity: object) =>
  getMetadataArgsStorage()
    .uniques.filter((unique) => unique.target === entity)
    .flatMap((unique) => (Array.isArray(unique.columns) ? unique.columns : []));

const columnOn = (entity: object, propertyName: string) =>
  getMetadataArgsStorage().columns.find(
    (column) => column.target === entity && column.propertyName === propertyName,
  );

const relationOn = (entity: object, propertyName: string) =>
  getMetadataArgsStorage().relations.find(
    (relation) => relation.target === entity && relation.propertyName === propertyName,
  );

describe("themes", () => {
  it("requires a category id on every row", () => {
    expect(columnOn(ThemeEntity, "categoryId")?.options.nullable).toBeFalsy();
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

// Nothing backfills these, so the default is what the whole catalog is worth on deploy day.
describe("the staging flags serving filters on", () => {
  it("holds a Theme back until an Editor publishes it", () => {
    expect(columnOn(ThemeEntity, "published")?.options).toMatchObject({ default: false });
  });

  it("holds a Question back until an Editor readies it", () => {
    expect(columnOn(QuestionEntity, "readyToBePublished")?.options).toMatchObject({
      name: "ready_to_be_published",
      default: false,
    });
  });
});
