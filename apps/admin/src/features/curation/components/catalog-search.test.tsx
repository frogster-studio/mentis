// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useSyncExternalStore } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromApi, sendToApi } from "@/lib/api/client";
import { useCatalogQuestions, useSaveQuestion, useStageQuestion } from "../api";
import type { Category, Question, Theme } from "../types";
import { CurationDashboard } from "./curation-dashboard";

vi.mock("@/lib/api/client", () => ({
  getFromApi: vi.fn(),
  sendToApi: vi.fn(),
  deleteFromApi: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(useLocationSearch()),
}));

// Like Next's shallow routing, the params follow pushState and popstate alike.
const useLocationSearch = () =>
  useSyncExternalStore(
    (onChange) => {
      window.addEventListener("popstate", onChange);
      return () => window.removeEventListener("popstate", onChange);
    },
    () => window.location.search,
  );

let root: Root;
let container: HTMLDivElement;

let nextId = 0;
const id = (): string => `9a3e0d3a-0000-4000-8000-${String(++nextId).padStart(12, "0")}`;

const HISTOIRE: Category = {
  id: id(),
  name: "Histoire",
  color: "#6d4c41",
  secondaryColor: "#efebe9",
  icon: "history-edu",
};
const CHEVALERIE: Theme = {
  id: id(),
  name: "Chevalerie",
  categoryId: HISTOIRE.id,
  image: "default.webp",
  published: false,
  questionCount: 1,
  readyQuestionCount: 0,
};
const BAYARD: Question = {
  id: id(),
  themeId: CHEVALERIE.id,
  text: "Quel chevalier français était surnommé « sans peur et sans reproche » ?",
  answer: "Bayard",
  aliases: ["Pierre Terrail"],
  misspellings: [],
  wrongChoices: ["Du Guesclin", "Roland", "Lancelot"],
  explanation: null,
  readyToBePublished: false,
};

let corpus: () => Promise<Question[]>;

const corpusFetches = () =>
  vi.mocked(getFromApi).mock.calls.filter(([path, , query]) => path === "/questions" && !query)
    .length;

const combobox = () => container.querySelector('[role="combobox"]') as HTMLInputElement;
const options = () => Array.from(container.querySelectorAll('[role="option"]'));
const groupLabels = () =>
  Array.from(container.querySelectorAll('[role="listbox"] legend')).map((node) => node.textContent);
const marks = () => Array.from(container.querySelectorAll("mark"));
const option = (text: string) =>
  options().find((node) => node.textContent?.includes(text)) as HTMLElement;
const button = (label: string) =>
  container.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
const detailsName = () =>
  (container.querySelector('main input[aria-label="Name"]') as HTMLInputElement | null)?.value;
const detailsQuestion = () =>
  (container.querySelector("main textarea") as HTMLTextAreaElement | null)?.value;

// React reads the input through its own value tracker, so a raw assignment would look like no change.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set as (
  this: HTMLInputElement,
  value: string,
) => void;

async function type(input: HTMLInputElement, text: string) {
  await act(async () => {
    input.focus();
    nativeValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const search = (text: string) => type(combobox(), text);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

async function click(node: HTMLElement) {
  await act(async () => {
    node.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    node.click();
  });
  await settle();
}

const newClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
      mutations: { retry: false },
    },
  });

async function renderDashboard() {
  await act(async () => {
    root.render(
      <QueryClientProvider client={newClient()}>
        <CurationDashboard />
      </QueryClientProvider>,
    );
  });
  await settle();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/");
  corpus = async () => [BAYARD];
  vi.mocked(getFromApi).mockImplementation(async (path: string, _schema, query) => {
    if (path === "/categories") return [HISTOIRE];
    if (path === "/themes") return [CHEVALERIE];
    if (path === "/questions") return query ? [BAYARD] : corpus();
    return { publicBaseUrl: "https://images.example.com" };
  });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("the Search bar", () => {
  it("sits in the header as a combobox placeheld Search the Catalog", async () => {
    await renderDashboard();
    expect(container.querySelector("header")?.contains(combobox())).toBe(true);
    expect(combobox().placeholder).toBe("Search the Catalog");
    expect(combobox().getAttribute("aria-expanded")).toBe("false");
  });

  it("fetches every Question once at mount, without a Theme", async () => {
    await renderDashboard();
    expect(corpusFetches()).toBe(1);
    await search("bayard");
    await search("chevalerie");
    expect(corpusFetches()).toBe(1);
  });

  it("opens no list on a query holding no word", async () => {
    await renderDashboard();
    await search("?");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(container.textContent).not.toContain("No results.");
    await search("   ");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
  });

  it("says so when nothing is found", async () => {
    await renderDashboard();
    await search("napoleon");
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(container.textContent).toContain("No results.");
  });

  it("lists Categories and Themes while the corpus is pending, Questions Loading…", async () => {
    corpus = () => new Promise(() => {});
    await renderDashboard();
    await search("h");
    expect(groupLabels()).toEqual(["Categories · 1", "Questions"]);
    expect(container.querySelector('[role="listbox"]')?.textContent).toContain("Loading…");
  });

  it("groups Categories, Themes and Questions, each labelled with its total", async () => {
    await renderDashboard();
    await search("ch");
    expect(groupLabels()).toEqual(["Themes · 1", "Questions · 1"]);
    expect(combobox().getAttribute("aria-expanded")).toBe("true");
    expect(combobox().getAttribute("aria-controls")).toBe(
      container.querySelector('[role="listbox"]')?.id,
    );
  });

  it("shows a Category's badge and name", async () => {
    await renderDashboard();
    await search("hist");
    const [row] = options();
    expect(row.textContent).toContain("Histoire");
    expect((row.querySelector("span") as HTMLElement).style.backgroundColor).toBe("#6d4c41");
  });

  it("shows a Theme's name, its Category's name and its Published badge", async () => {
    await renderDashboard();
    await search("chevalerie");
    const [row] = options();
    expect(row.textContent).toBe("ChevalerieHistoireUnpublished");
    expect(marks().map((mark) => mark.textContent)).toEqual(["Chevalerie"]);
  });

  it("shows a Question's text, Canonical Answer, found wrong choices and Theme name", async () => {
    await renderDashboard();
    await search("chevalier roland");
    const [row] = options();
    expect(row.textContent).toContain(BAYARD.text);
    expect(row.textContent).toContain("Bayard · Roland");
    expect(row.textContent).not.toContain("Lancelot");
    expect(row.textContent).toContain("Chevalerie");
  });

  it("highlights found words whole, in their spelling, only in searched fields", async () => {
    await renderDashboard();
    await search("francais bay");
    expect(marks().map((mark) => mark.textContent)).toEqual(["français", "Bayard"]);
    expect(marks()[0].className).toContain("text-sky-700");
    expect(marks()[0].className).toContain("font-medium");
    await search("chevalier");
    const themeName = options()[0].lastElementChild as HTMLElement;
    expect(themeName.textContent).toBe("Chevalerie");
    expect(themeName.querySelector("mark")).toBeNull();
  });

  it("never finds a Question by its Alias", async () => {
    await renderDashboard();
    await search("terrail");
    expect(container.textContent).toContain("No results.");
  });
});

describe("the Questions corpus", () => {
  let saveQuestion: ReturnType<typeof useSaveQuestion>;
  let stageQuestion: ReturnType<typeof useStageQuestion>;

  const CorpusHarness = () => {
    useCatalogQuestions();
    saveQuestion = useSaveQuestion();
    stageQuestion = useStageQuestion();
    return null;
  };

  beforeEach(async () => {
    vi.mocked(sendToApi).mockResolvedValue(BAYARD);
    await act(async () => {
      root.render(
        <QueryClientProvider client={newClient()}>
          <CorpusHarness />
        </QueryClientProvider>,
      );
    });
  });

  it("is refetched after a Question save", async () => {
    const { id: _id, readyToBePublished: _ready, ...question } = BAYARD;
    await act(async () => saveQuestion.mutateAsync({ id: BAYARD.id, question }));
    expect(corpusFetches()).toBe(2);
  });

  it("is not refetched after a Ready flip", async () => {
    await act(async () =>
      stageQuestion.mutateAsync({
        id: BAYARD.id,
        themeId: BAYARD.themeId,
        readyToBePublished: true,
      }),
    );
    expect(sendToApi).toHaveBeenCalled();
    expect(corpusFetches()).toBe(1);
  });
});

describe("selecting a result", () => {
  it("selects a Category, a Theme or a Question in the columns and in Details", async () => {
    await renderDashboard();
    await search("histoire");
    await click(option("Histoire"));
    expect(window.location.search).toBe(`?category=${HISTOIRE.id}`);
    expect(detailsName()).toBe("Histoire");

    await search("chevalerie");
    await click(option("Chevalerie"));
    expect(window.location.search).toBe(`?category=${HISTOIRE.id}&theme=${CHEVALERIE.id}`);
    expect(detailsName()).toBe("Chevalerie");

    await search("bayard");
    await click(option("Quel"));
    expect(window.location.search).toBe(
      `?category=${HISTOIRE.id}&theme=${CHEVALERIE.id}&question=${BAYARD.id}`,
    );
    expect(detailsQuestion()).toBe(BAYARD.text);
  });

  it("closes the list and keeps the query, refocusing reopens the same results", async () => {
    await renderDashboard();
    await search("chevalerie");
    const mousedown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    option("Chevalerie").dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBe(true);
    await click(option("Chevalerie"));
    expect(container.querySelector('[role="listbox"]')).toBeNull();
    expect(combobox().value).toBe("chevalerie");
    await act(async () => combobox().focus());
    expect(options().map((node) => node.textContent)).toEqual(["ChevalerieHistoireUnpublished"]);
  });

  it("asks before leaving a dirty form, and a refusal moves nothing", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    await renderDashboard();
    await click(button("New Category"));
    await type(container.querySelector('main input[aria-label="Name"]') as HTMLInputElement, "Art");
    await search("chevalerie");
    await click(option("Chevalerie"));
    expect(confirm).toHaveBeenCalledOnce();
    expect(window.location.search).toBe("");
    expect(detailsName()).toBe("Art");
    expect(container.querySelector('[role="listbox"]')).not.toBeNull();

    confirm.mockReturnValue(true);
    await click(option("Chevalerie"));
    expect(window.location.search).toBe(`?category=${HISTOIRE.id}&theme=${CHEVALERIE.id}`);
    expect(detailsName()).toBe("Chevalerie");
  });

  it("pushes a history entry, so Back returns to the previous selection", async () => {
    await renderDashboard();
    await search("histoire");
    await click(option("Histoire"));
    await search("bayard");
    await click(option("Quel"));
    await act(async () => window.history.back());
    await settle();
    expect(window.location.search).toBe(`?category=${HISTOIRE.id}`);
    expect(detailsName()).toBe("Histoire");
  });

  it("scrolls the selected rows into view once their columns render", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    await renderDashboard();
    await search("bayard");
    await click(option("Quel"));
    const scrolled = scrollIntoView.mock.contexts.map((row) => (row as Element).textContent);
    expect(scrolled).toEqual([
      expect.stringContaining("Histoire"),
      expect.stringContaining("Chevalerie"),
      expect.stringContaining(BAYARD.text),
    ]);
  });

  it("scrolls nothing on a deep link", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    window.history.replaceState(
      null,
      "",
      `/?category=${HISTOIRE.id}&theme=${CHEVALERIE.id}&question=${BAYARD.id}`,
    );
    await renderDashboard();
    expect(detailsQuestion()).toBe(BAYARD.text);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });

  it("scrolls nothing when history brings a searched row back", async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, "scrollIntoView");
    await renderDashboard();
    await search("bayard");
    await click(option("Quel"));
    scrollIntoView.mockClear();
    await act(async () => window.history.back());
    await settle();
    await act(async () => window.history.forward());
    await settle();
    expect(detailsQuestion()).toBe(BAYARD.text);
    expect(scrollIntoView).not.toHaveBeenCalled();
  });
});
