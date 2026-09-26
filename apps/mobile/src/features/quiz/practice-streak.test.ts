import { describe, expect, it } from "vitest";
import type { OutboxEntry } from "./outbox";
import { practiceStreak } from "./practice-streak";

const OWNER = "owner-a";
const OTHER = "owner-b";

function entry(owner: string, finishedAt: string): OutboxEntry {
  return { id: finishedAt, owner, themeId: "geo", themeName: "Géographie", points: 35, finishedAt };
}

const accountStreak = { lastDay: "2026-04-10", length: 5, longest: 5 };
const seed = { lastDay: "2026-03-01", length: 2, longest: 9 };
const outbox = [entry(OWNER, "2026-04-10T22:30:00.000Z"), entry(OTHER, "2026-04-11T22:30:00.000Z")];
const deviceDays = ["2026-03-02", "2026-03-03"];

describe("practiceStreak", () => {
  it("signed in, overlays the owner's pending Paris days on the Account's Streak", () => {
    expect(practiceStreak(OWNER, { accountStreak, outbox, seed, deviceDays })).toStrictEqual({
      lastDay: "2026-04-11",
      length: 6,
      longest: 6,
    });
  });

  it("signed in, is null until the Account stats load", () => {
    expect(
      practiceStreak(OWNER, { accountStreak: undefined, outbox, seed, deviceDays }),
    ).toBeNull();
  });

  it("signed out, overlays the device days on the seed and ignores the Account world", () => {
    expect(practiceStreak(undefined, { accountStreak, outbox, seed, deviceDays })).toStrictEqual({
      lastDay: "2026-03-03",
      length: 4,
      longest: 9,
    });
  });

  it("signed out with no seed, counts the device days alone", () => {
    expect(
      practiceStreak(undefined, { accountStreak, outbox, seed: null, deviceDays }),
    ).toStrictEqual({ lastDay: "2026-03-03", length: 2, longest: 2 });
  });
});
