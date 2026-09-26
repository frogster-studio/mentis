import { describe, expect, it } from "vitest";
import { accountPracticeStreak, currentStreak, mergeStreak, parisDay } from "./streak";

describe("parisDay", () => {
  it("dates a late UTC evening on the next Paris day", () => {
    expect(parisDay(new Date("2026-03-31T23:30:00Z"))).toBe("2026-04-01");
  });

  it("keeps a winter UTC evening before the Paris midnight on the same day", () => {
    expect(parisDay(new Date("2026-01-15T22:59:00Z"))).toBe("2026-01-15");
  });

  it("zero-pads the month and the day", () => {
    expect(parisDay(new Date("2026-02-03T12:00:00Z"))).toBe("2026-02-03");
  });
});

describe("currentStreak", () => {
  const streak = { lastDay: "2026-04-10", length: 4, longest: 9 };

  it("counts the run when it ends today", () => {
    expect(currentStreak(streak, "2026-04-10")).toBe(4);
  });

  it("counts the run when it ends yesterday", () => {
    expect(currentStreak(streak, "2026-04-11")).toBe(4);
  });

  it("drops to 0 once a day is missed", () => {
    expect(currentStreak(streak, "2026-04-12")).toBe(0);
  });

  it("is 0 with no day", () => {
    expect(currentStreak({ lastDay: null, length: 0, longest: 0 }, "2026-04-10")).toBe(0);
  });
});

describe("mergeStreak", () => {
  const five = { lastDay: "2026-04-10", length: 5, longest: 5 };

  it("extends the run with the following days", () => {
    expect(mergeStreak(five, ["2026-04-11", "2026-04-12", "2026-04-13"])).toStrictEqual({
      lastDay: "2026-04-13",
      length: 8,
      longest: 8,
    });
  });

  it("changes nothing with days already inside the run", () => {
    expect(mergeStreak(five, ["2026-04-07", "2026-04-10", "2026-04-10"])).toStrictEqual(five);
  });

  it("starts a new run after a gap and keeps the longest", () => {
    expect(mergeStreak({ ...five, longest: 7 }, ["2026-04-13"])).toStrictEqual({
      lastDay: "2026-04-13",
      length: 1,
      longest: 7,
    });
  });

  it("carries a run across a month and a year boundary", () => {
    expect(
      mergeStreak({ lastDay: "2026-12-31", length: 2, longest: 2 }, ["2027-01-01"]),
    ).toStrictEqual({ lastDay: "2027-01-01", length: 3, longest: 3 });
  });

  it("computes from unsorted, duplicated days alone with no Streak", () => {
    expect(
      mergeStreak(null, ["2026-04-05", "2026-04-02", "2026-04-01", "2026-04-03", "2026-04-02"]),
    ).toStrictEqual({ lastDay: "2026-04-05", length: 1, longest: 3 });
  });

  it("is the empty Streak with no Streak and no day", () => {
    expect(mergeStreak(null, [])).toStrictEqual({ lastDay: null, length: 0, longest: 0 });
  });

  it("keeps an empty Streak empty", () => {
    expect(mergeStreak({ lastDay: null, length: 0, longest: 0 }, [])).toStrictEqual({
      lastDay: null,
      length: 0,
      longest: 0,
    });
  });
});

describe("accountPracticeStreak", () => {
  const five = { lastDay: "2026-04-10", length: 5, longest: 5 };

  it("merges the pending days into the Account's Streak", () => {
    expect(accountPracticeStreak(five, ["2026-04-11"])).toStrictEqual({
      lastDay: "2026-04-11",
      length: 6,
      longest: 6,
    });
  });

  it("is the Account's Streak with nothing pending", () => {
    expect(accountPracticeStreak(five, [])).toStrictEqual(five);
  });

  it("is null while the Account stats never loaded, pending days or not", () => {
    expect(accountPracticeStreak(undefined, ["2026-04-11"])).toBeNull();
  });
});

describe("the sign-out seed scenario", () => {
  const accountStreak = { lastDay: "2026-04-10", length: 5, longest: 5 };
  const deviceDays = ["2026-04-11", "2026-04-12", "2026-04-13"];

  it("carries an Account Streak of 5 into 3 signed-out days, then keeps 8 after the transfer", () => {
    const seed = accountPracticeStreak(accountStreak, []);
    const signedOut = mergeStreak(seed, deviceDays);
    expect(currentStreak(signedOut, "2026-04-13")).toBe(8);

    const transferred = accountPracticeStreak(mergeStreak(accountStreak, deviceDays), []);
    expect(transferred).toStrictEqual(signedOut);
  });

  it("keeps the unpushed sessions of the sign-out in the seed", () => {
    const seed = accountPracticeStreak(accountStreak, ["2026-04-11"]);
    expect(currentStreak(mergeStreak(seed, ["2026-04-12"]), "2026-04-12")).toBe(7);
  });

  it("is the device days alone with no seed", () => {
    expect(mergeStreak(accountPracticeStreak(undefined, []), deviceDays)).toStrictEqual({
      lastDay: "2026-04-13",
      length: 3,
      longest: 3,
    });
  });
});
