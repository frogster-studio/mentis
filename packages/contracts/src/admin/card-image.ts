import { z } from "zod";

// ADR 0001: the API mints the URL and the browser PUTs the processed webp straight to storage.
export const adminUploadUrlResponseSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
});
export type AdminUploadUrlResponse = z.output<typeof adminUploadUrlResponseSchema>;
