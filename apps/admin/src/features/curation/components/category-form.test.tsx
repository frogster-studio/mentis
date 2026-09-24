// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendToApi } from "@/lib/api/client";
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
