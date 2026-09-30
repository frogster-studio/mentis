// The name a row captured when played outlives the Theme's deletion from the catalog.
export type CapturedThemeName = {
  themeId: string;
  themeName: string;
  capturedAt: Date;
};
