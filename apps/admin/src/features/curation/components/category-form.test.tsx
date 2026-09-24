// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendToApi } from "@/lib/api/client";
import { iconGlyph, suggestIcons } from "../icons";
import type { Category } from "../types";
import { CategoryForm } from "./category-form";

vi.mock("@/lib/api/client", () => ({
  getFromApi: vi.fn(),
  sendToApi: vi.fn(),
  deleteFromApi: vi.fn(),
}));

let root: Root;
let container: HTMLDivElement;
const stored: Category = {
  id: "3f1d0d3a-0000-4000-8000-000000000001",
  name: "Gastronomie",
  color: "#c4a2cb",
  secondaryColor: "#e34e43",
  icon: "restaurant",
};
const labelled = (label: string) =>
  container.querySelector(`input[aria-label="${label}"]`) as HTMLInputElement;
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (node) => node.textContent === label,
  ) as HTMLButtonElement;
const swatchOf = (label: string) =>
  labelled(label).parentElement?.querySelector("button > span") as HTMLElement;
const fieldBody = (label: string) =>
  Array.from(container.querySelectorAll("span")).find((node) => node.textContent === label)
    ?.nextElementSibling as HTMLElement;
const chip = () => fieldBody("Preview").firstElementChild as HTMLElement;
const chipBadge = () => chip().firstElementChild as HTMLElement;
const chipName = () => chip().children[1] as HTMLElement | undefined;
const tiles = () => Array.from(container.querySelectorAll("ul button"));
const openIconGrid = () => act(async () => labelled("Icon").click());

// React reads the input through its own value tracker, so a raw assignment would look like no change.
const nativeValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set as (
  this: HTMLInputElement,
  value: string,
) => void;

async function type(label: string, text: string) {
  const input = labelled(label);
  await act(async () => {
    nativeValue.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function renderForm(category?: Category) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <CategoryForm
          category={category}
          isVisible={true}
          themeCount={0}
          onDirtyChange={vi.fn()}
          onSaved={vi.fn()}
          onDeleted={vi.fn()}
        />
      </QueryClientProvider>,
    );
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
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

describe("category form layout", () => {
  it("offers Name, Preview, Main color and Secondary color", async () => {
    await renderForm(stored);
    const labels = Array.from(container.querySelectorAll("span")).map((node) => node.textContent);
    expect(labels).toEqual(expect.arrayContaining(["Name", "Preview", "Main color"]));
    expect(labels).toEqual(expect.arrayContaining(["Secondary color", "Icon", "Staging"]));
    expect(labelled("Main color").value).toBe("#c4a2cb");
    expect(labelled("Secondary color").value).toBe("#e34e43");
    expect(swatchOf("Secondary color").style.backgroundColor).toBe("#e34e43");
  });

  it("starts a new Category at the default colors", async () => {
    await renderForm();
    expect(labelled("Main color").value).toBe("#0ea5e9");
    expect(labelled("Secondary color").value).toBe("#ffffff");
  });
});

describe("the preview chip", () => {
  it("mirrors the app's chip: the pill in the secondary color, the badge in the color", async () => {
    await renderForm(stored);
    expect(chip().style.backgroundColor).toBe("#e34e43");
    expect(chipBadge().style.backgroundColor).toBe("#c4a2cb");
    expect(chipBadge().textContent).toBe(iconGlyph("restaurant"));
    expect(chipBadge().style.color).toBe("#250313");
    expect(chipName()?.textContent).toBe("Gastronomie");
    expect(chipName()?.className).toContain("font-chip");
    expect(chipName()?.className).toContain("uppercase");
    expect(chipName()?.style.color).toBe("#250313");
    expect(chip().querySelector("svg")).toBeNull();
  });

  it("follows the name, both colors and the icon without saving", async () => {
    await renderForm(stored);
    await type("Name", "Gastronomie et vins");
    await type("Main color", "#ffe3a0");
    await type("Secondary color", "#fff6e2");
    await type("Icon", "movie");
    expect(chipName()?.textContent).toBe("Gastronomie et vins");
    expect(chipBadge().style.backgroundColor).toBe("#ffe3a0");
    expect(chip().style.backgroundColor).toBe("#fff6e2");
    expect(chipBadge().textContent).toBe(iconGlyph("movie"));
    expect(sendToApi).not.toHaveBeenCalled();
  });

  it("shows the badge alone without a name, and an empty badge for an unknown icon", async () => {
    await renderForm(stored);
    await type("Name", "");
    expect(chip().children).toHaveLength(1);
    await type("Icon", "gastronomie");
    expect(chipBadge().textContent).toBe("");
  });

  it("previews a Category being created", async () => {
    await renderForm();
    await type("Name", "Histoire");
    expect(chip().style.backgroundColor).toBe("#ffffff");
    expect(chipBadge().style.backgroundColor).toBe("#0ea5e9");
    expect(chipName()?.textContent).toBe("Histoire");
  });
});

describe("editing the secondary color", () => {
  it("enables Save and sends secondaryColor in the body", async () => {
    vi.mocked(sendToApi).mockResolvedValue({ ...stored, secondaryColor: "#fff6e2" });
    await renderForm(stored);
    expect(button("Save changes").disabled).toBe(true);
    await type("Secondary color", "#fff6e2");
    expect(swatchOf("Secondary color").style.backgroundColor).toBe("#fff6e2");
    expect(button("Save changes").disabled).toBe(false);
    await act(async () => button("Save changes").click());
    expect(sendToApi).toHaveBeenCalledWith(
      "PATCH",
      `/categories/${stored.id}`,
      expect.objectContaining({ color: "#c4a2cb", secondaryColor: "#fff6e2" }),
      expect.anything(),
    );
  });

  it("blocks Save on a stored secondary color the contract would refuse, until it is replaced", async () => {
    await renderForm({ ...stored, secondaryColor: "white" });
    expect(container.textContent).toContain("Not a #rrggbb color");
    await type("Name", "Gastronomie et vins");
    expect(button("Save changes").disabled).toBe(true);
    await type("Secondary color", "#FFF6E2");
    expect(container.textContent).not.toContain("Not a #rrggbb color");
    expect(button("Save changes").disabled).toBe(false);
  });
});

describe("the icon grid", () => {
  it("opens on a click, glyph-only tiles named by their title, every match reachable", async () => {
    await renderForm(stored);
    await openIconGrid();
    expect(tiles().map((tile) => tile.getAttribute("title"))).toEqual(suggestIcons("restaurant"));
    expect(tiles()[0].textContent).toBe(iconGlyph("restaurant"));
    expect(tiles().every((tile) => (tile.textContent ?? "").length === 1)).toBe(true);
    expect(container.querySelector("ul")?.className).toContain("overflow-y-auto");
  });

  it("washes the tile the field names in the form's color, and follows a color change", async () => {
    await renderForm(stored);
    await openIconGrid();
    const washed = tiles().filter((tile) => (tile as HTMLElement).style.backgroundColor !== "");
    expect(washed.map((tile) => tile.getAttribute("title"))).toEqual(["restaurant"]);
    expect((washed[0] as HTMLElement).style.backgroundColor).toBe("#c4a2cb40");
    await type("Main color", "#ffe3a0");
    const stillWashed = tiles().filter(
      (tile) => (tile as HTMLElement).style.backgroundColor !== "",
    );
    expect(stillWashed.map((tile) => tile.getAttribute("title"))).toEqual(["restaurant"]);
    expect((stillWashed[0] as HTMLElement).style.backgroundColor).toBe("#ffe3a040");
  });

  it("picks a tile into the field, closing the grid", async () => {
    await renderForm(stored);
    await openIconGrid();
    const menu = tiles().find((tile) => tile.getAttribute("title") === "restaurant-menu");
    await act(async () => (menu as HTMLButtonElement).click());
    expect(labelled("Icon").value).toBe("restaurant-menu");
    expect(container.querySelector("ul")).toBeNull();
    expect(chipBadge().textContent).toBe(iconGlyph("restaurant-menu"));
  });

  it("shows no tile and says so when no glyph answers to the name", async () => {
    await renderForm(stored);
    await openIconGrid();
    await type("Icon", "zzzzzz");
    expect(tiles()).toHaveLength(0);
    expect(container.textContent).toContain("No MaterialIcons glyph answers to that name.");
  });
});
