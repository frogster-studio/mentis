import type { AdminUploadUrlResponse } from "@mentis/contracts/admin";
import { adminUploadUrlResponseSchema } from "@mentis/contracts/admin";

import { requestJson } from "@/lib/api/client";

// ADR 0001: the API only mints the URL, the browser PUTs the webp to storage itself.
export async function createCardImageUploadUrl(): Promise<AdminUploadUrlResponse> {
  return requestJson(
    { method: "POST", path: "/admin/card-images/upload-url" },
    adminUploadUrlResponseSchema,
  );
}
