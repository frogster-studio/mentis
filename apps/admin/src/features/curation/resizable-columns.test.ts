// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_LIST_WIDTHS_REM,
  fitToWidth,
  moveBoundary,
  readListWidths,
  storeListWidths,
} from "./resizable-columns";

const DEFAULT_WIDTHS = [13, 19.5, 26, 30];

describe("moveBoundary", () => {
  it("trades width between the two columns either side of the handle", () => {
    expect(moveBoundary(DEFAULT_WIDTHS, 0, 5)).toEqual([18, 14.5, 26, 30]);
    expect(moveBoundary(DEFAULT_WIDTHS, 1, -2)).toEqual([13, 17.5, 28, 30]);
  });

  it("pushes the columns to the right nearest-first, each down to its minimum", () => {
    expect(moveBoundary(DEFAULT_WIDTHS, 0, 15)).toEqual([28, 10, 20.5, 30]);
    expect(moveBoundary(DEFAULT_WIDTHS, 0, 100)).toEqual([48.5, 10, 10, 20]);
  });

  it("pushes the columns to the left nearest-first, the right neighbor taking it all", () => {
    expect(moveBoundary(DEFAULT_WIDTHS, 1, -15)).toEqual([10, 10, 38.5, 30]);
    expect(moveBoundary(DEFAULT_WIDTHS, 2, -100)).toEqual([10, 10, 10, 58.5]);
  });

  it("stops the last handle once Details reaches its minimum", () => {
    expect(moveBoundary(DEFAULT_WIDTHS, 2, 15)).toEqual([13, 19.5, 36, 20]);
  });

  it("gives pushed columns their room back when the drag returns, since it starts from the same widths", () => {
    moveBoundary(DEFAULT_WIDTHS, 0, 100);
    expect(moveBoundary(DEFAULT_WIDTHS, 0, 5)).toEqual([18, 14.5, 26, 30]);
  });
});

describe("fitToWidth", () => {
  it("hands Details whatever the chosen widths leave", () => {
    expect(fitToWidth([13, 19.5, 26], 100)).toEqual([13, 19.5, 26, 41.5]);
  });

  it("squeezes Questions first, then Themes, then Categories, to keep Details at its minimum", () => {
    expect(fitToWidth([13, 19.5, 26], 70)).toEqual([13, 19.5, 17.5, 20]);
    expect(fitToWidth([13, 19.5, 26], 55)).toEqual([13, 12, 10, 20]);
  });

  it("holds every column at its minimum when even those overflow the window", () => {
    expect(fitToWidth([13, 19.5, 26], 45)).toEqual([10, 10, 10, 20]);
  });
});

describe("readListWidths", () => {
  beforeEach(() => localStorage.clear());

  it("reads back the stored widths", () => {
    storeListWidths([20, 15, 30]);
    expect(readListWidths()).toEqual([20, 15, 30]);
  });

  it("falls back on the defaults when nothing valid is stored", () => {
    expect(readListWidths()).toEqual(DEFAULT_LIST_WIDTHS_REM);
    localStorage.setItem("resizable-columns:v1", JSON.stringify([20, 5, 30]));
    expect(readListWidths()).toEqual(DEFAULT_LIST_WIDTHS_REM);
    localStorage.setItem("resizable-columns:v1", "not json");
    expect(readListWidths()).toEqual(DEFAULT_LIST_WIDTHS_REM);
  });
});
