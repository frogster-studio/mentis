import { describe, expect, it } from "vitest";
import { countFigure, rankFigure, scoreFigure } from "./stat-figures";

describe("countFigure", () => {
  it("reads a count, zero included", () => {
    expect(countFigure(0)).toBe("0");
    expect(countFigure(230)).toBe("230");
  });

  it("reads « -- » when the count is unknown", () => {
    expect(countFigure(null)).toBe("--");
  });
});

describe("scoreFigure", () => {
  it("reads an integer score over 50", () => {
    expect(scoreFigure(35)).toBe("35/50");
    expect(scoreFigure(0)).toBe("0/50");
  });

  it("reads « -- » with no score", () => {
    expect(scoreFigure(null)).toBe("--");
  });
});

describe("rankFigure", () => {
  it("reads a rank as « n°850 »", () => {
    expect(rankFigure(850)).toBe("n°850");
  });

  it("reads « -- » with no rank", () => {
    expect(rankFigure(null)).toBe("--");
  });
});
