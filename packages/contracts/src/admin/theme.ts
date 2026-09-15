import { z } from "zod";

export const DEFAULT_THEME_IMAGE = "default.webp";

export const adminThemeIdSchema = z.guid();

export const adminThemeResponseSchema = z.object({
  id: z.guid(),
  name: z.string(),
  categoryId: z.guid(),
  // The stored bucket path, not the composed URL: curation edits the path the app reads through.
  image: z.string(),
  published: z.boolean(),
  cleanupToken: z.string().optional(),
});
export type AdminThemeResponse = z.infer<typeof adminThemeResponseSchema>;

export const adminThemeListResponseSchema = z.array(
  adminThemeResponseSchema.extend({
    questionCount: z.number().int().nonnegative(),
    readyQuestionCount: z.number().int().nonnegative(),
  }),
);
export type AdminThemeListResponse = z.infer<typeof adminThemeListResponseSchema>;

// Neither the slug nor Published is authored here: one is born from the name, the other is staging.
export const adminThemeWriteSchema = z.object({
  name: z.string().trim().min(1).max(255),
  categoryId: z.guid(),
  image: z.string().trim().min(1).max(255).default(DEFAULT_THEME_IMAGE),
  expectedImage: z.string().min(1).max(255).optional(),
  imageUploadToken: z.string().max(4096).optional(),
});
export type AdminThemeWrite = z.infer<typeof adminThemeWriteSchema>;

// Staging is a write of its own: the API stores the flag as sent and recomputes no count (ADR 0008).
export const adminThemeStagingSchema = z.object({ published: z.boolean() });
export type AdminThemeStaging = z.infer<typeof adminThemeStagingSchema>;

// ADR 0007: the API mints the URL and the browser PUTs the processed webp straight to storage.
export const adminThemeImageUploadResponseSchema = z.object({
  path: z.string().min(1),
  signedUrl: z.url(),
  token: z.string(),
});
export type AdminThemeImageUploadResponse = z.infer<typeof adminThemeImageUploadResponseSchema>;

export const adminThemeImageUploadSchema = z.object({
  themeId: z.guid().optional(),
  name: z.string().trim().min(1).max(255),
  expectedImage: z.string().min(1).max(255),
});
export type AdminThemeImageUpload = z.infer<typeof adminThemeImageUploadSchema>;

export const adminThemeImageResetSchema = z.object({ expectedImage: z.string().min(1).max(255) });
export type AdminThemeImageReset = z.infer<typeof adminThemeImageResetSchema>;

export const adminThemeImageCleanupSchema = z.object({ token: z.string().min(1).max(4096) });
export type AdminThemeImageCleanup = z.infer<typeof adminThemeImageCleanupSchema>;
export const adminThemeImageCleanupResponseSchema = z.object({ deleted: z.boolean() });
export type AdminThemeImageCleanupResponse = z.infer<typeof adminThemeImageCleanupResponseSchema>;

export const adminThemeImageConfigSchema = z.object({ publicBaseUrl: z.url() });
export type AdminThemeImageConfig = z.infer<typeof adminThemeImageConfigSchema>;
