import { describe, expect, it } from "vitest";

import { type CatalogSearch, type Highlight, SEARCH_CAPS, searchCatalog } from "./search-catalog";
import type { Category, Question, Theme } from "./types";

const HISTOIRE = "3f1d0d3a-0000-4000-8000-000000000001";
const NAPOLEON = "5c2e0d3a-0000-4000-8000-000000000001";

let nextId = 0;
const id = (): string => `9a3e0d3a-0000-4000-8000-${String(++nextId).padStart(12, "0")}`;

const category = (name: string): Category => ({
  id: id(),
  name,
  color: "#6d4c41",
  secondaryColor: "#efebe9",
  icon: "history-edu",
});

const theme = (name: string, patch: Partial<Theme> = {}): Theme => ({
  id: id(),
  name,
  categoryId: HISTOIRE,
  image: "default.webp",
  published: true,
  questionCount: 0,
  readyQuestionCount: 0,
  ...patch,
});

const question = (patch: Partial<Question>): Question => ({
  id: id(),
  themeId: NAPOLEON,
  text: "Qui ?",
  answer: "Personne",
  aliases: [],
  misspellings: [],
  wrongChoices: ["Alpha", "Bravo", "Charlie"],
  explanation: null,
  readyToBePublished: true,
  ...patch,
});

const BAYARD = question({
  text: "Quel chevalier français était surnommé « sans peur et sans reproche » ?",
  answer: "Bayard",
  wrongChoices: ["Du Guesclin", "Roland", "Lancelot"],
});

const search = (
  query: string,
  catalog: Partial<{ categories: Category[]; themes: Theme[]; questions: Question[] }>,
): CatalogSearch => {
  const found = searchCatalog(query, { categories: [], themes: [], questions: [], ...catalog });
  if (found === null) throw new Error(`${query} holds no word`);
  return found;
};

const questionTexts = (query: string, questions: Question[]): string[] =>
  search(query, { questions }).questions.results.map(({ item }) => item.text);

const themeNames = (query: string, themes: Theme[]): string[] =>
  search(query, { themes }).themes.results.map(({ item }) => item.name);

const spelled = (text: string, highlights: Highlight[]): string[] =>
  highlights.map(({ start, end }) => text.slice(start, end));

describe("searchCatalog", () => {
  it("searches nothing for a query holding no word", () => {
    expect(searchCatalog("?", { categories: [], themes: [], questions: [BAYARD] })).toBeNull();
    expect(searchCatalog("   ", { categories: [], themes: [], questions: [BAYARD] })).toBeNull();
  });

  it("lets a Question's query words land in different fields", () => {
    expect(questionTexts("chevalier bayard", [BAYARD])).toEqual([BAYARD.text]);
    expect(questionTexts("chevalier roland", [BAYARD])).toEqual([BAYARD.text]);
  });

  it("never unites words across entities", () => {
    const found = search("histoire napoleon", {
      categories: [{ ...category("Histoire"), id: HISTOIRE }],
      themes: [{ ...theme("Napoléon"), id: NAPOLEON }],
    });
    expect(found.categories.total).toBe(0);
    expect(found.themes.total).toBe(0);
  });

  it("searches neither Aliases, Misspellings nor Explanations", () => {
    const hidden = question({
      aliases: ["terrail"],
      misspellings: ["bayart"],
      explanation: "Pierre Terrail, seigneur de Bayard",
    });
    expect(questionTexts("terrail", [hidden])).toEqual([]);
    expect(questionTexts("bayart", [hidden])).toEqual([]);
    expect(questionTexts("seigneur", [hidden])).toEqual([]);
  });

  it("finds unready Questions and unpublished Themes", () => {
    expect(questionTexts("bayard", [{ ...BAYARD, readyToBePublished: false }])).toEqual([
      BAYARD.text,
    ]);
    expect(themeNames("napoleon", [theme("Napoléon", { published: false })])).toEqual(["Napoléon"]);
  });

  it("ranks more whole-word finds first", () => {
    expect(themeNames("roi france", [theme("Rois francesi"), theme("Les rois de France")])).toEqual(
      ["Les rois de France", "Rois francesi"],
    );
  });

  it("ranks a Question found in its Canonical Answer, then its text, then its wrong choices", () => {
    const inWrongChoice = question({ text: "A ?", wrongChoices: ["Paris", "Lyon", "Nice"] });
    const inText = question({ text: "Paris, longtemps ?" });
    const inAnswer = question({ text: "Quelle capitale, depuis toujours ?", answer: "Paris" });
    expect(questionTexts("paris", [inWrongChoice, inText, inAnswer])).toEqual([
      inAnswer.text,
      inText.text,
      inWrongChoice.text,
    ]);
  });

  it("ranks whole finds above the best field", () => {
    const wholeInText = question({ text: "Le Mont Blanc ?" });
    const startInAnswer = question({ text: "Quelle butte ?", answer: "Montmartre" });
    expect(questionTexts("mont", [startInAnswer, wholeInText])).toEqual([
      wholeInText.text,
      startInAnswer.text,
    ]);
  });

  it("then ranks the shorter, then alphabetically", () => {
    expect(
      themeNames("rois", [theme("Rois de France"), theme("Rois mages"), theme("Rois anglais")]),
    ).toEqual(["Rois mages", "Rois anglais", "Rois de France"]);
    expect(themeNames("roi", [theme("Rois b"), theme("Rois à")])).toEqual(["Rois à", "Rois b"]);
  });

  it("caps each group and carries its uncapped total", () => {
    const names = Array.from({ length: 10 }, (_, index) => `Rome ${index}`);
    const found = search("rome", {
      categories: names.map(category),
      themes: names.map((name) => theme(name)),
      questions: names.map((text) => question({ text })),
    });
    expect(found.categories.results).toHaveLength(SEARCH_CAPS.categories);
    expect(found.themes.results).toHaveLength(SEARCH_CAPS.themes);
    expect(found.questions.results).toHaveLength(SEARCH_CAPS.questions);
    expect([found.categories.total, found.themes.total, found.questions.total]).toEqual([
      10, 10, 10,
    ]);
  });

  it("highlights every found word of a name in its original spelling", () => {
    const [found] = search("francais", { categories: [category("Le cinéma français")] }).categories
      .results;
    expect(spelled(found.item.name, found.nameHighlights)).toEqual(["français"]);
  });

  it("lists the wrong choices holding a find, every shown field with its highlights", () => {
    const [found] = search("sans du", { questions: [BAYARD] }).questions.results;
    expect(spelled(BAYARD.text, found.textHighlights)).toEqual(["sans", "sans"]);
    expect(found.answerHighlights).toEqual([]);
    expect(
      found.foundWrongChoices.map(({ wrongChoice, highlights }) => [
        wrongChoice,
        spelled(wrongChoice, highlights),
      ]),
    ).toEqual([["Du Guesclin", ["Du"]]]);
  });

  it("highlights a word found by two query words once", () => {
    const [found] = search("che chevalier", { questions: [BAYARD] }).questions.results;
    expect(spelled(BAYARD.text, found.textHighlights)).toEqual(["chevalier"]);
  });
});
