import {
  type AdminThemeImageUpload,
  type AdminThemeResponse,
  type AdminThemeWrite,
  adminThemeImageCleanupResponseSchema,
  adminThemeImageUploadResponseSchema,
  adminThemeListResponseSchema,
  adminThemeResponseSchema,
  DEFAULT_THEME_IMAGE,
} from "@mentis/contracts/admin";
import { getFromApi, sendToApi } from "@/lib/api/client";
import { processThemeImage } from "./theme-image";

function encodeWebp(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL("./theme-image-worker.ts", import.meta.url));
    const timeout = window.setTimeout(() => {
      worker.terminate();
      reject(new Error("Conversion trop longue."));
    }, 60_000);
    const finish = () => {
      clearTimeout(timeout);
      worker.terminate();
    };
    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      finish();
      if (event.data.blob) resolve(event.data.blob);
      else reject(new Error(event.data.error));
    };
    worker.onerror = () => {
      finish();
      reject(new Error("Conversion indisponible."));
    };
    worker.postMessage(file);
  });
}

export async function uploadThemeImage(file: File, input: AdminThemeImageUpload) {
  const encoded = await processThemeImage(file, encodeWebp);
  const upload = await sendToApi(
    "POST",
    "/themes/image-upload-url",
    input,
    adminThemeImageUploadResponseSchema,
  );
  let stored: Response;
  try {
    stored = await fetch(upload.signedUrl, {
      method: "PUT",
      headers: { "content-type": "image/webp" },
      body: encoded,
      signal: AbortSignal.timeout(60_000),
    });
  } catch {
    throw new Error(
      "Connexion interrompue pendant l’import. L’image actuelle est conservée. Réessayez.",
    );
  }
  if (!stored.ok) throw new Error("L’import a échoué. L’image actuelle est conservée. Réessayez.");
  return upload;
}

export async function cleanupThemeImage(token: string): Promise<void> {
  await sendToApi("POST", "/themes/image-cleanup", { token }, adminThemeImageCleanupResponseSchema);
}

export async function saveThemeWithImage(input: {
  id?: string;
  theme: AdminThemeWrite;
  file?: File;
}): Promise<AdminThemeResponse> {
  const { id, theme, file } = input;
  const upload = file
    ? await uploadThemeImage(file, {
        themeId: id,
        name: theme.name,
        expectedImage: theme.expectedImage ?? theme.image,
      })
    : undefined;
  const payload = upload ? { ...theme, image: upload.path, imageUploadToken: upload.token } : theme;
  try {
    return await sendToApi(
      id ? "PATCH" : "POST",
      id ? `/themes/${id}` : "/themes",
      payload,
      adminThemeResponseSchema,
    );
  } catch (failure) {
    if (upload) {
      const themes = await getFromApi("/themes", adminThemeListResponseSchema).catch(() => []);
      const stored = themes.find((row) => row.image === upload.path);
      if (stored) {
        if ((theme.expectedImage ?? theme.image) === DEFAULT_THEME_IMAGE) return stored;
        try {
          await cleanupThemeImage(upload.token);
          return stored;
        } catch {
          return { ...stored, cleanupToken: upload.token };
        }
      }
    }
    throw new Error(
      failure instanceof Error ? failure.message : "Enregistrement impossible. Réessayez.",
    );
  }
}
