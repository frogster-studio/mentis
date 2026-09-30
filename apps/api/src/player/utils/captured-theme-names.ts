import type { CapturedThemeName } from "../types/captured-theme-name";

export const latestCapturedNames = (captures: CapturedThemeName[]): Map<string, string> => {
  const latest = new Map<string, CapturedThemeName>();
  for (const capture of captures) {
    const current = latest.get(capture.themeId);
    if (current === undefined || capture.capturedAt > current.capturedAt) {
      latest.set(capture.themeId, capture);
    }
  }
  return new Map([...latest].map(([themeId, capture]) => [themeId, capture.themeName]));
};
