// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getFromApi, sendToApi } from "@/lib/api/client";
import { validateThemeImage } from "../theme-image";
import { ImageField } from "./image-field";
import { ThemeForm } from "./theme-form";

vi.mock("@/lib/api/client", () => ({
  getFromApi: vi.fn(),
  sendToApi: vi.fn(),
  deleteFromApi: vi.fn(),
}));
vi.mock("../theme-image", async (original) => ({
  ...(await original<typeof import("../theme-image")>()),
  validateThemeImage: vi.fn().mockResolvedValue(undefined),
  processThemeImage: vi.fn(async (file: File) => file),
}));

let root: Root;
let container: HTMLDivElement;
const changed = vi.fn();
const validating = vi.fn();
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
      onValidatingChange={validating}
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
  vi.mocked(validateThemeImage).mockResolvedValue(undefined);
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
  it("shows the existing image, filename, format and custom status", async () => {
    await act(async () => root.render(<FieldHarness />));
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
    expect(text()).toContain("old.webp · .webp · Image personnalisée");
  });
  it("selects and cancels a local preview without uploading", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(new File(["png"], "new.png", { type: "image/png" }));
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.png");
    expect(button("Supprimer l’image").disabled).toBe(true);
    expect(sendToApi).not.toHaveBeenCalled();
    await click("Annuler la sélection");
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://images.example/old.webp",
    );
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:new.png");
  });
  it("revokes previous previews when another image is selected and on unmount", async () => {
    await act(async () => root.render(<FieldHarness />));
    await choose(new File(["one"], "one.png"));
    await choose(new File(["two"], "two.png"));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:one.png");
    await act(async () => root.render(null));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:two.png");
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
    const file = new File(["image"], "drop.png");
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
  it("keeps the current preview after an invalid selection", async () => {
    await act(async () => root.render(<FieldHarness />));
    vi.mocked(validateThemeImage).mockRejectedValueOnce(new Error("Photo trop lourde"));
    await choose(new File(["bad"], "bad.png"));
    expect(container.querySelector('[role="alert"]')?.textContent).toBe("Photo trop lourde");
    expect(changed).not.toHaveBeenCalled();
  });
  it("ignores a slower validation for an earlier selection", async () => {
    let resolveFirst: () => void = () => {};
    vi.mocked(validateThemeImage).mockReturnValueOnce(
      new Promise<void>((resolve) => {
        resolveFirst = resolve;
      }),
    );
    await act(async () => root.render(<FieldHarness />));
    await choose(new File(["one"], "one.png"));
    await choose(new File(["two"], "two.png"));
    await act(async () => resolveFirst());
    expect(changed).toHaveBeenCalledTimes(1);
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:two.png");
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
          onValidatingChange={validating}
          onReset={reset}
        />,
      ),
    );
    expect(button("Supprimer l’image")).toBeUndefined();
    expect(text()).toContain("Image par défaut");
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
    expect(text()).toContain("Image par défaut");
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
    await choose(new File(["webp"], "new.webp", { type: "image/webp" }));
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
    await choose(new File(["webp"], "new.webp", { type: "image/webp" }));
    await click("SAVE");
    expect(sendToApi).toHaveBeenCalledOnce();
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.webp");
    expect(text()).toContain("old.webp · .webp");
    expect(text()).toContain("L’import a échoué");
  });
  it("keeps the selection if the database rejects the save", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockRejectedValueOnce(new Error("Database unavailable"));
    await renderForm();
    vi.mocked(getFromApi).mockResolvedValue([]);
    await choose(new File(["webp"], "new.webp", { type: "image/webp" }));
    await click("SAVE");
    expect(container.querySelector("img")?.getAttribute("src")).toBe("blob:new.webp");
    expect(text()).toContain("old.webp · .webp");
    expect(button("SAVE").disabled).toBe(false);
  });
  it("offers cleanup retry while displaying the successfully saved replacement", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
    vi.mocked(sendToApi)
      .mockResolvedValueOnce(upload)
      .mockResolvedValueOnce({ ...current, image: upload.path, cleanupToken: "cleanup-token" });
    await renderForm();
    await choose(new File(["webp"], "new.webp", { type: "image/webp" }));
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
