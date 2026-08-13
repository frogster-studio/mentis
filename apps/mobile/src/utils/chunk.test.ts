import { describe, expect, it } from "vitest";
import { chunk } from "./chunk";

describe("chunk", () => {
  it("returns nothing for an empty list, so a drain with no rows sends no request", () => {
    expect(chunk([], 200)).toEqual([]);
  });

  it("keeps a list shorter than the size as a single batch", () => {
    expect(chunk([1, 2, 3], 200)).toEqual([[1, 2, 3]]);
  });

  it("splits an exact multiple without trailing an empty batch", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("puts the remainder in a last, shorter batch", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("preserves order across batches — the queue drains oldest-first", () => {
    const items = Array.from({ length: 450 }, (_, index) => index);
    const batches = chunk(items, 200);
    expect(batches.map((batch) => batch.length)).toEqual([200, 200, 50]);
    expect(batches.flat()).toEqual(items);
  });
});
