// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useReportUnsavedChanges } from "@/components/workspace-shell";
import { getFromApi, putFileToApi, sendToApi } from "@/lib/api/client";
import type { Anecdote } from "../types";
import { lossy } from "../webp-fixtures";
import { AnecdotesWorkspace } from "./anecdotes-workspace";

vi.mock("@/lib/api/client", () => ({
  getFromApi: vi.fn(),
  sendToApi: vi.fn(),
  putFileToApi: vi.fn(),
  deleteFromApi: vi.fn(),
}));
vi.mock("@/components/workspace-shell", () => ({ useReportUnsavedChanges: vi.fn() }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(window.location.search),
}));

let root: Root;
let container: HTMLDivElement;
let stored: Anecdote[];

const PIGEON: Anecdote = {
  id: "5b2e0d3a-0000-4000-8000-000000000001",
  text: "Un **pigeon** a reçu la __Dickin Medal__.",
  imageUrl: null,
};
const MIEL: Anecdote = {
  id: "5b2e0d3a-0000-4000-8000-000000000002",
  text: "Le miel ne se périme jamais.",
  imageUrl: null,
};

const rows = () => Array.from(container.querySelectorAll<HTMLButtonElement>("section button"));
const row = (text: string) =>
  rows().find((node) => node.textContent?.includes(text)) as HTMLButtonElement;
const labelled = (label: string) =>
  container.querySelector(`[aria-label="${label}"]`) as HTMLElement;
const textarea = () => container.querySelector("textarea") as HTMLTextAreaElement | null;
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (node) => node.textContent === label,
  ) as HTMLButtonElement;
const fieldBody = (label: string) =>
  Array.from(container.querySelectorAll("span")).find((node) => node.textContent === label)
    ?.nextElementSibling as HTMLElement;

// React reads a field through its own value tracker, so a raw assignment would look like no change.
async function typeInto(field: HTMLInputElement | HTMLTextAreaElement, text: string) {
  const setValue = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), "value")?.set;
  await act(async () => {
    setValue?.call(field, text);
    field.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

const alerts = () =>
  Array.from(container.querySelectorAll('[role="alert"]'), (node) => node.textContent).filter(
    Boolean,
  );
const frame = () => container.querySelector("fieldset button > span") as HTMLElement;
const rowImage = (text: string) => row(text).querySelector("img")?.getAttribute("src");
const webp = (name: string) => new File([lossy(750, 1024)], name, { type: "image/webp" });

async function choose(file: File) {
  const input = container.querySelector("input[type=file]") as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await settle();
}

const type = (text: string) => typeInto(textarea() as HTMLTextAreaElement, text);

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });

async function click(node: HTMLElement) {
  await act(async () => node.click());
  await settle();
}

async function renderWorkspace() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <AnecdotesWorkspace />
      </QueryClientProvider>,
    );
  });
  await settle();
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  window.history.replaceState(null, "", "/anecdotes");
  stored = [PIGEON, MIEL];
  vi.mocked(getFromApi).mockImplementation(async () => stored);
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => `blob:${(blob as File).name}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
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

describe("selecting an Anecdote", () => {
  it("shows an empty Details column until a row is clicked", async () => {
    await renderWorkspace();
    expect(container.textContent).toContain("Details");
    expect(container.textContent).toContain("Select an Anecdote to see it here.");
    expect(textarea()).toBeNull();
  });

  it("opens the row's form and carries ?anecdote= beside ?q=", async () => {
    window.history.replaceState(null, "", "/anecdotes?q=pigeon");
    await renderWorkspace();
    await click(row("pigeon"));
    expect(textarea()?.value).toBe(PIGEON.text);
    expect(new URLSearchParams(window.location.search).get("anecdote")).toBe(PIGEON.id);
    expect(new URLSearchParams(window.location.search).get("q")).toBe("pigeon");
  });

  it("keeps the selection when the search changes", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await typeInto(container.querySelector("header input") as HTMLInputElement, "miel");
    expect(window.location.search).toBe(`?anecdote=${PIGEON.id}&q=miel`);
  });

  it("restores the selection from the URL on a reload", async () => {
    window.history.replaceState(null, "", `/anecdotes?anecdote=${MIEL.id}`);
    await renderWorkspace();
    expect(textarea()?.value).toBe(MIEL.text);
    expect(row("miel").parentElement?.className).toContain("bg-sky-50");
  });
});

describe("creating an Anecdote", () => {
  it("opens an empty form from the + button in the list's header band", async () => {
    window.history.replaceState(null, "", `/anecdotes?anecdote=${MIEL.id}`);
    await renderWorkspace();
    const create = labelled("New Anecdote");
    expect(create.getAttribute("title")).toBe("New Anecdote");
    await click(create);
    expect(textarea()?.value).toBe("");
    expect(new URLSearchParams(window.location.search).has("anecdote")).toBe(false);
    expect(button("Create Anecdote").disabled).toBe(true);
  });

  it("POSTs the trimmed text, then selects the saved Anecdote in a refetched list", async () => {
    const created: Anecdote = {
      id: "5b2e0d3a-0000-4000-8000-000000000003",
      text: "",
      imageUrl: null,
    };
    vi.mocked(sendToApi).mockImplementation(async (_method, _path, body) => {
      const { text } = body as { text: string };
      created.text = text;
      stored = [...stored, created];
      return { id: created.id, text, image: null };
    });
    await renderWorkspace();
    await click(labelled("New Anecdote"));
    await type("  Les **loutres** se tiennent la main.  ");
    await click(button("Create Anecdote"));
    expect(sendToApi).toHaveBeenCalledWith(
      "POST",
      "/anecdotes",
      { text: "Les **loutres** se tiennent la main." },
      expect.anything(),
    );
    expect(getFromApi).toHaveBeenCalledTimes(2);
    expect(new URLSearchParams(window.location.search).get("anecdote")).toBe(created.id);
    expect(textarea()?.value).toBe("Les **loutres** se tiennent la main.");
    expect(button("Save changes").disabled).toBe(true);
  });
});

describe("editing an Anecdote's text", () => {
  it("keeps the markers in the textarea and renders them in the preview", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un **chat** et un __chien__.");
    expect(textarea()?.value).toBe("Un **chat** et un __chien__.");
    const preview = fieldBody("Preview");
    expect(preview.textContent).toBe("Un chat et un chien.");
    expect(preview.querySelector(".font-bold")?.textContent).toBe("chat");
    expect(preview.querySelector(".italic")?.textContent).toBe("chien");
  });

  it("counts the trimmed text, markers included, out of 140", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await type("  **abc**  ");
    expect(container.textContent).toContain("7 / 140");
  });

  it("disables Save for an empty text or one over 140", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await type("   ");
    expect(button("Save changes").disabled).toBe(true);
    await type(`**${"a".repeat(137)}**`);
    expect(container.textContent).toContain("141 / 140");
    expect(button("Save changes").disabled).toBe(true);
    await type(`**${"a".repeat(136)}**`);
    expect(button("Save changes").disabled).toBe(false);
  });

  it("PATCHes the Anecdote and refetches the list", async () => {
    vi.mocked(sendToApi).mockResolvedValue({ id: PIGEON.id, text: "Un pigeon.", image: null });
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un pigeon.");
    await click(button("Save changes"));
    expect(sendToApi).toHaveBeenCalledWith(
      "PATCH",
      `/anecdotes/${PIGEON.id}`,
      { text: "Un pigeon." },
      expect.anything(),
    );
    expect(getFromApi).toHaveBeenCalledTimes(2);
  });

  it("shows the API's message when the save fails", async () => {
    vi.mocked(sendToApi).mockRejectedValue(new Error("Anecdote introuvable."));
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un pigeon.");
    await click(button("Save changes"));
    expect(alerts()).toEqual(["Anecdote introuvable."]);
  });
});

describe("a dirty form", () => {
  it("reports itself to the workspace rail, and clears once saved", async () => {
    vi.mocked(sendToApi).mockResolvedValue({ id: PIGEON.id, text: "Un pigeon.", image: null });
    await renderWorkspace();
    await click(row("pigeon"));
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([false]);
    await type("Un pigeon.");
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([true]);
    await click(button("Save changes"));
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([false]);
  });

  it("asks before switching row, and stays when the Editor declines", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un pigeon.");
    await click(row("miel"));
    expect(confirm).toHaveBeenCalledWith("This form has unsaved changes. Leave anyway?");
    expect(textarea()?.value).toBe("Un pigeon.");
    confirm.mockReturnValue(true);
    await click(row("miel"));
    expect(textarea()?.value).toBe(MIEL.text);
  });

  it("asks before opening a new form", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un pigeon.");
    await click(labelled("New Anecdote"));
    expect(confirm).toHaveBeenCalledOnce();
    expect(textarea()?.value).toBe("Un pigeon.");
  });

  it("switches freely while the form is clean", async () => {
    const confirm = vi.fn(() => false);
    vi.stubGlobal("confirm", confirm);
    await renderWorkspace();
    await click(row("pigeon"));
    await click(row("miel"));
    expect(confirm).not.toHaveBeenCalled();
    expect(textarea()?.value).toBe(MIEL.text);
  });
});

describe("the Anecdote Image", () => {
  const IMAGE_URL = "https://images.example/anecdote-images/one.webp";
  const NEW_IMAGE_URL = "https://images.example/anecdote-images/two.webp";

  const storeImage = (id: string, imageUrl: string) => {
    stored = stored.map((anecdote) => (anecdote.id === id ? { ...anecdote, imageUrl } : anecdote));
  };

  it("shows an empty dashed 750/1024 frame, no label, under the shared rule's hint", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    expect(frame().className).toContain("border-dashed");
    expect(frame().className).toContain("aspect-[750/1024]");
    expect(frame().textContent).toBe("");
    expect(container.textContent).toContain("Image WebP · 750 × 1024 px · 200 Ko maximum.");
    expect(container.querySelector("input[type=file]")?.getAttribute("accept")).toBe(
      ".webp,image/webp",
    );
  });

  it("shows the stored image whole inside the frame", async () => {
    storeImage(PIGEON.id, IMAGE_URL);
    await renderWorkspace();
    await click(row("pigeon"));
    const image = container.querySelector("fieldset img") as HTMLImageElement;
    expect(image.getAttribute("src")).toBe(IMAGE_URL);
    expect(image.classList).toContain("object-contain");
  });

  it("refuses a file that breaks the shared rule and stays clean", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await choose(new File([lossy(700, 700)], "small.webp", { type: "image/webp" }));
    expect(alerts()).toEqual(["L’image doit mesurer 750 × 1024 px."]);
    expect(button("Save changes").disabled).toBe(true);
  });

  it("previews a valid file locally and makes the form dirty", async () => {
    await renderWorkspace();
    await click(row("pigeon"));
    await choose(webp("pigeon.webp"));
    expect(container.querySelector("fieldset img")?.getAttribute("src")).toBe("blob:pigeon.webp");
    expect(button("Save changes").disabled).toBe(false);
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([true]);
    expect(putFileToApi).not.toHaveBeenCalled();
  });

  it("PUTs the file alone when the text is unchanged, and the list shows the new image", async () => {
    storeImage(PIGEON.id, IMAGE_URL);
    const file = webp("pigeon.webp");
    vi.mocked(putFileToApi).mockImplementation(async () => {
      storeImage(PIGEON.id, NEW_IMAGE_URL);
      return { id: PIGEON.id, text: PIGEON.text, image: "two.webp" };
    });
    await renderWorkspace();
    await click(row("pigeon"));
    await choose(file);
    await click(button("Save changes"));
    expect(sendToApi).not.toHaveBeenCalled();
    expect(putFileToApi).toHaveBeenCalledWith(
      `/anecdotes/${PIGEON.id}/image`,
      file,
      expect.anything(),
    );
    expect(rowImage("pigeon")).toBe(NEW_IMAGE_URL);
    expect(container.querySelector("fieldset img")?.getAttribute("src")).toBe(NEW_IMAGE_URL);
    expect(button("Save changes").disabled).toBe(true);
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([false]);
  });

  it("sends the text first, then the file", async () => {
    const calls: string[] = [];
    vi.mocked(sendToApi).mockImplementation(async (method) => {
      calls.push(method);
      return { id: PIGEON.id, text: "Un pigeon.", image: null };
    });
    vi.mocked(putFileToApi).mockImplementation(async () => {
      calls.push("PUT");
      return { id: PIGEON.id, text: "Un pigeon.", image: "two.webp" };
    });
    await renderWorkspace();
    await click(row("pigeon"));
    await type("Un pigeon.");
    await choose(webp("pigeon.webp"));
    await click(button("Save changes"));
    expect(calls).toEqual(["PATCH", "PUT"]);
  });

  it("keeps a new Anecdote's text saved and its file for a retry when the PUT fails", async () => {
    const created: Anecdote = {
      id: "5b2e0d3a-0000-4000-8000-000000000003",
      text: "Les loutres se tiennent la main.",
      imageUrl: null,
    };
    vi.mocked(sendToApi).mockImplementation(async () => {
      stored = [...stored, created];
      return { id: created.id, text: created.text, image: null };
    });
    vi.mocked(putFileToApi).mockRejectedValueOnce(new Error("L’image doit mesurer 750 × 1024 px."));
    const file = webp("loutres.webp");
    await renderWorkspace();
    await click(labelled("New Anecdote"));
    await type(created.text);
    await choose(file);
    await click(button("Create Anecdote"));
    expect(new URLSearchParams(window.location.search).get("anecdote")).toBe(created.id);
    expect(row("loutres").parentElement?.className).toContain("bg-sky-50");
    expect(alerts()).toEqual(["L’image doit mesurer 750 × 1024 px."]);
    expect(container.querySelector("fieldset img")?.getAttribute("src")).toBe("blob:loutres.webp");
    expect(textarea()?.value).toBe(created.text);
    expect(vi.mocked(useReportUnsavedChanges).mock.lastCall).toEqual([true]);

    vi.mocked(putFileToApi).mockResolvedValueOnce({ ...created, image: "loutres.webp" });
    await click(button("Save changes"));
    expect(sendToApi).toHaveBeenCalledOnce();
    expect(putFileToApi).toHaveBeenLastCalledWith(
      `/anecdotes/${created.id}/image`,
      file,
      expect.anything(),
    );
    expect(alerts()).toEqual([]);
  });

  it("offers no control that removes the image on its own", async () => {
    storeImage(PIGEON.id, IMAGE_URL);
    await renderWorkspace();
    await click(row("pigeon"));
    const labels = Array.from(container.querySelectorAll("button"), (node) => node.textContent);
    expect(labels.some((label) => label?.includes("Supprimer"))).toBe(false);
  });
});
