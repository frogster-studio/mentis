// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromApi, sendToApi } from "@/lib/api/client";
import { selectedImageError } from "../image-rule";
import { lossy } from "../webp-fixtures";
import { ImageField } from "./image-field";
import { ThemeForm } from "./theme-form";

vi.mock("@/lib/api/client", () => ({
  getFromApi: vi.fn(),
  sendToApi: vi.fn(),
  deleteFromApi: vi.fn(),
}));
vi.mock("../image-rule", async (original) => {
  const rule = await original<typeof import("../image-rule")>();
  return { ...rule, selectedImageError: vi.fn(rule.selectedImageError) };
});

let root: Root;
let container: HTMLDivElement;
const changed = vi.fn();
const reset = vi.fn();
const current = {
  id: "5c2e0d3a-0000-4000-8000-000000000001",
  name: "Les Simpson",
  categoryId: "3f1d0d3a-0000-4000-8000-000000000001",
  image: "old.webp",
  published: false,
  questionCount: 24,
  readyQuestionCount: 20,
};
const text = () => container.textContent ?? "";
const alert = () => container.querySelector('[role="alert"]')?.textContent;
const webp = (name: string) => new File([lossy(750, 1024)], name, { type: "image/webp" });
const button = (label: string) =>
  Array.from(container.querySelectorAll("button")).find(
    (node) => node.textContent === label,
  ) as HTMLButtonElement;
async function choose(file: File) {
  const input = container.querySelector("input[type=file]") as HTMLInputElement;
  Object.defineProperty(input, "files", { configurable: true, value: [file] });
  await act(async () => {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function click(label: string) {
  await act(async () => button(label).click());
}

function FieldHarness() {
  const [file, setFile] = useState<File | null>(null);
  return (
    <ImageField
      path="old.webp"
      publicBaseUrl="https://images.example/"
      file={file}
      isBusy={false}
      onFileChange={(next) => {
        changed(next);
        setFile(next);
      }}
      onReset={reset}
    />
  );
}
async function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <ThemeForm
          theme={current}
          categories={[]}
          selectedCategoryId={current.categoryId}
          isCategoryLastPublishedTheme={false}
          onDirtyChange={changed}
          onSaved={vi.fn()}
          onDeleted={vi.fn()}
        />
      </QueryClientProvider>,
    );
  });
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 10));
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  vi.stubGlobal("localStorage", {
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  });
  vi.spyOn(URL, "createObjectURL").mockImplementation((blob) => `blob:${(blob as File).name}`);
  vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
  vi.mocked(getFromApi).mockResolvedValue({ publicBaseUrl: "https://images.example/" });
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

describe("theme image field", () => {
  it("shows the existing image and filename", async () => {
    await act(async () => root.render(<FieldHarness />));
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
    expect(text()).toContain("old.webp");
  });
  it("selects and cancels a local preview without uploading", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(webp("new.webp"));
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.webp");
    expect(button("Supprimer l’image").disabled).toBe(true);
    expect(sendToApi).not.toHaveBeenCalled();
    await click("Annuler la sélection");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:new.webp");
  });
  it("revokes previous previews when another image is selected and on unmount", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(webp("one.webp"));
    await choose(webp("two.webp"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:one.webp");
    await act(async () => root.render(null));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:two.webp");
  });
  it("shows drag feedback and accepts a dropped file", async () => {
    await act(async () => root.render(<FieldHarness />));
    const zone = container.querySelector("fieldset") as HTMLElement;
    await act(async () =>
      zone.dispatchEvent(new Event("dragenter", { bubbles: true, cancelable: true })),
    );
    expect(zone.dataset.dragging).toBe("true");
    expect(text()).toContain("Déposez votre image ici");
    const drop = new Event("drop", { bubbles: true, cancelable: true });
    const file = webp("drop.webp");
    Object.defineProperty(drop, "dataTransfer", { value: { files: [file] } });
    await act(async () => zone.dispatchEvent(drop));
    expect(zone.dataset.dragging).toBe("false");
    expect(changed).toHaveBeenCalledWith(file);
  });
  it("keeps drag feedback while moving over children and clears it on leaving", async () => {
    await act(async () => root.render(<FieldHarness />));
    const zone = container.querySelector("fieldset") as HTMLElement;
    for (const event of ["dragenter", "dragenter", "dragleave"])
      await act(async () =>
        zone.dispatchEvent(new Event(event, { bubbles: true, cancelable: true })),
      );
    expect(zone.dataset.dragging).toBe("true");
    await act(async () =>
      zone.dispatchEvent(new Event("dragleave", { bubbles: true, cancelable: true })),
    );
    expect(zone.dataset.dragging).toBe("false");
  });
  it("refuses a PNG with the format message and keeps the current preview", async () => {
    await act(async () => root.render(<FieldHarness />));
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await choose(new File([png], "photo.png", { type: "image/png" }));
    expect(alert()).toBe("L’image doit être un fichier WebP.");
    expect(changed).not.toHaveBeenCalled();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
  });
  it("refuses a JPG with the format message", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(
      new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" }),
    );
    expect(alert()).toBe("L’image doit être un fichier WebP.");
    expect(changed).not.toHaveBeenCalled();
  });
  it("refuses a WebP that breaks the shared rule", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(new File([lossy(700, 700)], "small.webp", { type: "image/webp" }));
    expect(alert()).toBe("L’image doit mesurer 750 × 1024 px.");
    expect(changed).not.toHaveBeenCalled();
  });
  it("ignores a slower validation for an earlier selection", async () => {
    let resolveFirst: (error: string | null) => void = () => {};
    vi.mocked(selectedImageError).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveFirst = resolve;
      }),
    );
    await act(async () => root.render(<FieldHarness />));
    await choose(webp("one.webp"));
    await choose(webp("two.webp"));
    await act(async () => resolveFirst(null));
    expect(changed).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:two.webp");
  });
  it("states the shared rule and nothing else", async () => {
    await act(async () => root.render(<FieldHarness />));
    const hint = container.querySelector("button")?.getAttribute("aria-describedby") ?? "";
    const help = document.getElementById(hint);
    expect(help?.textContent).toBe("Image WebP · 750 × 1024 px · 200 Ko maximum.");
    expect(Array.from(help?.querySelectorAll("strong") ?? [], (node) => node.textContent)).toEqual([
      "WebP",
      "750 × 1024 px",
      "200 Ko",
    ]);
    expect(container.querySelector("input[type=file]")?.getAttribute("accept")).toBe(
      ".webp,image/webp",
    );
  });
  it("shows a legacy image whole inside a 750/1024 frame", async () => {
    await act(async () => root.render(<FieldHarness />));
    const image = container.querySelector("img") as HTMLImageElement;
    expect(image.classList).toContain("object-contain");
    expect(image.parentElement?.classList).toContain("aspect-[750/1024]");
  });
  it("never offers deletion for default.webp", async () => {
    await act(async () =>
      root.render(
        <ImageField
          path="default.webp"
          publicBaseUrl="https://images.example/"
          file={null}
          isBusy={false}
          onFileChange={changed}
          onReset={reset}
        />,
      ),
    );
    expect(button("Supprimer l’image")).toBeUndefined();
    expect(text()).toContain("image par défaut");
  });
});

describe("reset confirmation", () => {
  it("shows the fallback preview and waits for explicit confirmation", async () => {
    await renderForm();
    await click("Supprimer l’image");
    expect(container.querySelector("dialog")?.open).toBe(true);
    expect(text()).toContain("supprimée de Supabase Storage");
    expect(container.querySelector("dialog img")?.getAttribute("src")).toBe(
      "https://images.example/default.webp",
    );
    expect(sendToApi).not.toHaveBeenCalled();
    await click("Annuler");
    expect(container.querySelector("dialog")).toBeNull();
  });
  it("prevents duplicate confirmations and shows the default after success", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.mocked(sendToApi).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    await renderForm();
    await click("Supprimer l’image");
    await click("Supprimer et réinitialiser");
    expect(sendToApi).toHaveBeenCalledOnce();
    expect(button("Suppression…").disabled).toBe(true);
    await act(async () => finish({ ...current, image: "default.webp" }));
    expect(text()).toContain("image par défaut");
    expect(container.querySelector("dialog")).toBeNull();
  });
  it("preserves the current image on reset failure", async () => {
    vi.mocked(sendToApi).mockRejectedValueOnce(new Error("Réinitialisation impossible"));
    await renderForm();
    await click("Supprimer l’image");
    await click("Supprimer et réinitialiser");
    expect(text()).toContain("Réinitialisation impossible");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
  });
});

describe("saving a replacement", () => {
  const upload = {
    path: `${current.id}/version/les-simpson.webp`,
    signedUrl: "https://storage.example/upload",
    token: "upload-token",
  };
  it("uploads only on SAVE, prevents duplicates and updates the preview after persistence", async () => {
    let finish: (value: unknown) => void = () => {};
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      );
    await renderForm();
    await choose(webp("new.webp"));
    expect(sendToApi).not.toHaveBeenCalled();
    expect(changed).toHaveBeenCalledWith(true);
    await click("SAVE");
    expect(sendToApi).toHaveBeenCalledTimes(2);
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });
    expect(button("Enregistrement…").disabled).toBe(true);
    expect(sendToApi).toHaveBeenLastCalledWith(
      "PATCH",
      `/themes/${current.id}`,
      expect.objectContaining({
        image: upload.path,
        expectedImage: "old.webp",
        imageUploadToken: "upload-token",
      }),
      expect.anything(),
    );
    await act(async () => finish({ ...current, image: upload.path }));
    expect(text()).toContain("Thème enregistré");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      `https://images.example/${upload.path}`,
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:new.webp");
  });
  it("keeps the selection and old reference if the upload fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 503 })));
    vi.mocked(sendToApi).mockResolvedValueOnce(upload);
    await renderForm();
    await choose(webp("new.webp"));
    await click("SAVE");
    expect(sendToApi).toHaveBeenCalledOnce();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.webp");
    expect(text()).toContain("old.webp");
    expect(text()).toContain("L’import a échoué");
  });
  it("keeps the selection if the database rejects the save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new Error("Database unavailable"));
    await renderForm();
    vi.mocked(getFromApi).mockResolvedValue([]);
    await choose(webp("new.webp"));
    await click("SAVE");
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.webp");
    expect(text()).toContain("old.webp");
    expect(button("SAVE").disabled).toBe(false);
  });
  it("offers cleanup retry while displaying the successfully saved replacement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockResolvedValueOnce({ ...current, image: upload.path, cleanupToken: "cleanup-token" });
    await renderForm();
    await choose(webp("new.webp"));
    await click("SAVE");
    expect(text()).toContain("suppression de l’ancienne image reste à terminer");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      `https://images.example/${upload.path}`,
    );
    vi.mocked(sendToApi).mockResolvedValueOnce({ deleted: true });
    await click("Réessayer le nettoyage");
    expect(text()).toContain("Anciennes images supprimées");
  });
});
