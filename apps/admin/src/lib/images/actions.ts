"use server";

import type { AdminUploadUrlResponse } from "@mentis/contracts/admin";

import { createCardImageUploadUrl } from "@/lib/api/images";

// The browser can only reach the seam through an action.
export async function createCardImageUpload(): Promise<AdminUploadUrlResponse> {
  return createCardImageUploadUrl();
}
