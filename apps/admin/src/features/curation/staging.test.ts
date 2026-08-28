import { describe, expect, it } from "vitest";

import {
  isCategoryLastPublishedTheme,
  publishBlocker,
  questionFloorBlocker,
  READY_QUESTIONS_TO_PUBLISH,
  themeStagingConsequence,
} from "./staging";
import type { Question, Theme } from "./types";

const TELEVISION = "3f1d0d3a-0000-4000-8000-000000000001";
const HISTOIRE = "3f1d0d3a-0000-4000-8000-000000000002";

const theme = (patch: Partial<Theme>): Theme => ({
  id: "5c2e0d3a-0000-4000-8000-000000000001",
  name: "Les Simpson",
  categoryId: TELEVISION,
  image: "les-simpson.webp",
  published: false,
  questionCount: 24,
  readyQuestionCount: READY_QUESTIONS_TO_PUBLISH,
  ...patch,
});

const question = (readyToBePublished: boolean): Question => ({
  id: "9a3e0d3a-0000-4000-8000-000000000001",
  themeId: "5c2e0d3a-0000-4000-8000-000000000001",
  text: "Quelle est la capitale de l'Australie ?",
  answer: "Canberra",
  aliases: [],
  misspellings: [],
  wrongChoices: ["Sydney", "Melbourne", "Perth"],
  readyToBePublished,
});

describe("publishBlocker", () => {
  it("unlocks the switch at the twentieth Ready Question", () => {
    expect(publishBlocker(READY_QUESTIONS_TO_PUBLISH)).toBeNull();
  });

  it("unlocks the switch above the bar", () => {
    expect(publishBlocker(READY_QUESTIONS_TO_PUBLISH + 4)).toBeNull();
  });

  it("names how far a thin Theme still is", () => {
    expect(publishBlocker(19)).toBe(
      `19 Ready Questions of 20 — publish once the Theme holds ${READY_QUESTIONS_TO_PUBLISH}.`,
    );
  });

  it("speaks singular of a lone Ready Question", () => {
    expect(publishBlocker(1)).toContain("1 Ready Question of 20");
  });
});

describe("questionFloorBlocker", () => {
  it("blocks un-readying the twentieth Ready Question of a Published Theme", () => {
    const blocker = questionFloorBlocker(theme({ published: true }), question(true));
    expect(blocker).toContain("unpublish the Theme first");
  });

  it("blocks even below the bar, where a concurrent tab left the Theme", () => {
    const thin = theme({ published: true, readyQuestionCount: 12 });
    expect(questionFloorBlocker(thin, question(true))).not.toBeNull();
  });

  it("lets the twenty-first Ready Question go", () => {
    const spare = theme({ published: true, readyQuestionCount: READY_QUESTIONS_TO_PUBLISH + 1 });
    expect(questionFloorBlocker(spare, question(true))).toBeNull();
  });

  it("lets a Question that is not Ready go: it holds nothing up", () => {
    expect(questionFloorBlocker(theme({ published: true }), question(false))).toBeNull();
  });

  it("lets anything go under an unpublished Theme", () => {
    expect(questionFloorBlocker(theme({ published: false }), question(true))).toBeNull();
  });

  it("lets anything go while the Theme is still loading", () => {
    expect(questionFloorBlocker(undefined, question(true))).toBeNull();
  });
});

describe("isCategoryLastPublishedTheme", () => {
  const published = theme({ published: true });

  it("sees the Category go dark when nothing else is Published under it", () => {
    const others = [published, theme({ id: "other", published: false })];
    expect(isCategoryLastPublishedTheme(others, published)).toBe(true);
  });

  it("keeps the Category lit when a sibling stays Published", () => {
    const others = [published, theme({ id: "other", published: true })];
    expect(isCategoryLastPublishedTheme(others, published)).toBe(false);
  });

  it("counts only the Themes of the same Category", () => {
    const elsewhere = theme({ id: "other", published: true, categoryId: HISTOIRE });
    expect(isCategoryLastPublishedTheme([published, elsewhere], published)).toBe(true);
  });

  it("says nothing of a Theme that is not Published", () => {
    const unpublished = theme({ published: false });
    expect(isCategoryLastPublishedTheme([unpublished], unpublished)).toBe(false);
  });
});

describe("themeStagingConsequence", () => {
  it("counts what publishing makes playable", () => {
    const consequence = themeStagingConsequence(theme({ readyQuestionCount: 21 }), false);
    expect(consequence.confirmLabel).toBe("Publish");
    expect(consequence.lines).toEqual(["Players are served its 21 Ready Questions right away."]);
  });

  it("counts what unpublishing takes away", () => {
    const consequence = themeStagingConsequence(theme({ published: true }), false);
    expect(consequence.confirmLabel).toBe("Unpublish");
    expect(consequence.lines).toEqual([
      "Players stop being served its 20 Ready Questions right away.",
    ]);
  });

  it("warns that the Category goes dark with its last Published Theme", () => {
    const consequence = themeStagingConsequence(theme({ published: true }), true);
    expect(consequence.lines[1]).toContain("the Category disappears from the app");
  });
});
