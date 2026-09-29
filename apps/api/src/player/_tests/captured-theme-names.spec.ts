import { describe, expect, it } from "vitest";
import { latestCapturedNames } from "../utils/captured-theme-names";

const capture = (themeId: string, themeName: string, capturedAt: string) => ({
  themeId,
  themeName,
  capturedAt: new Date(capturedAt),
});

describe("latestCapturedNames", () => {
  it("keeps each Theme's most recently captured name, whatever the order it arrives in", () => {
    const names = latestCapturedNames([
      capture("geo", "Géographie", "2026-08-12T10:00:00.000Z"),
      capture("geo", "Géo", "2026-08-10T10:00:00.000Z"),
      capture("art", "Arts", "2026-08-01T10:00:00.000Z"),
    ]);

    expect(names).toEqual(
      new Map([
        ["geo", "Géographie"],
        ["art", "Arts"],
      ]),
    );
  });

  it("knows no name when nothing was captured", () => {
    expect(latestCapturedNames([])).toEqual(new Map());
  });
});
