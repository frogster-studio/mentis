import { describe, expect, it } from "vitest";
import { COLORS } from "@/theme/tokens";
import {
  type Anecdote,
  type AnecdoteDaySet,
  buildDaySet,
  dismissTopAnecdote,
  isDrawDue,
  pileColors,
  topAnecdote,
} from "./day-set";

const LATE_APRIL_10 = new Date("2026-04-10T21:59:00.000Z");
const EARLY_APRIL_11 = new Date("2026-04-10T22:00:00.000Z");

const ANECDOTES: Anecdote[] = [
  { id: "a", text: "Anecdote a" },
  { id: "b", text: "Anecdote b" },
  { id: "c", text: "Anecdote c" },
];

function daySet(dismissedCount: number): AnecdoteDaySet {
  return { ...buildDaySet(ANECDOTES, LATE_APRIL_10), dismissedCount };
}

describe("buildDaySet", () => {
  it("dates the set by the Europe/Paris day, not the UTC one", () => {
    expect(buildDaySet([], LATE_APRIL_10).day).toBe("2026-04-10");
    expect(buildDaySet([], EARLY_APRIL_11).day).toBe("2026-04-11");
  });

  it("stores the Anecdotes as served, none dismissed", () => {
    expect(buildDaySet(ANECDOTES, LATE_APRIL_10)).toStrictEqual({
      day: "2026-04-10",
      anecdotes: ANECDOTES,
      dismissedCount: 0,
    });
  });
});

describe("isDrawDue", () => {
  it("is due with no stored set", () => {
    expect(isDrawDue(null, LATE_APRIL_10)).toBe(true);
  });

  it("is due once the Paris day turns, even partly dismissed", () => {
    expect(isDrawDue(daySet(0), EARLY_APRIL_11)).toBe(true);
    expect(isDrawDue(daySet(1), EARLY_APRIL_11)).toBe(true);
  });

  it("is not due on the set's own day, dismissed or not", () => {
    expect(isDrawDue(daySet(0), LATE_APRIL_10)).toBe(false);
    expect(isDrawDue(daySet(3), LATE_APRIL_10)).toBe(false);
  });

  it("is not due again the day an empty set was received", () => {
    expect(isDrawDue(buildDaySet([], LATE_APRIL_10), LATE_APRIL_10)).toBe(false);
  });
});

describe("topAnecdote", () => {
  it("is the first not dismissed, at the dismissed count's position, so a relaunch resumes", () => {
    expect(topAnecdote(daySet(0))).toBe(ANECDOTES[0]);
    expect(topAnecdote(daySet(1))).toBe(ANECDOTES[1]);
    expect(topAnecdote(daySet(2))).toBe(ANECDOTES[2]);
  });

  it("is none once every Anecdote is dismissed, or none was received", () => {
    expect(topAnecdote(daySet(3))).toBeNull();
    expect(topAnecdote(buildDaySet([], LATE_APRIL_10))).toBeNull();
  });
});

describe("dismissTopAnecdote", () => {
  it("moves to the next Anecdote", () => {
    expect(topAnecdote(dismissTopAnecdote(daySet(0)))).toBe(ANECDOTES[1]);
    expect(dismissTopAnecdote(daySet(2)).dismissedCount).toBe(3);
  });

  it("never mutates the stored set", () => {
    const stored = daySet(0);
    dismissTopAnecdote(stored);
    expect(stored.dismissedCount).toBe(0);
  });

  it("leaves a fully dismissed or empty set untouched", () => {
    const dismissed = daySet(3);
    expect(dismissTopAnecdote(dismissed)).toBe(dismissed);
    const empty = buildDaySet([], LATE_APRIL_10);
    expect(dismissTopAnecdote(empty)).toBe(empty);
  });
});

describe("pileColors", () => {
  it("adds the troughDeep role", () => {
    expect(COLORS.troughDeep).toBe("#D7BBA1");
  });

  it("gives one colour per remaining Anecdote, top first", () => {
    expect(pileColors(3)).toStrictEqual([COLORS.face, COLORS.trough, COLORS.troughDeep]);
    expect(pileColors(2)).toStrictEqual([COLORS.face, COLORS.trough]);
    expect(pileColors(1)).toStrictEqual([COLORS.face]);
    expect(pileColors(0)).toStrictEqual([]);
  });
});
