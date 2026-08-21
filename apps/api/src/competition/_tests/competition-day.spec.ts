import { describe, expect, it } from "vitest";
import { competitionDay, daysBefore, seasonBounds } from "../utils/competition-day";

describe("competitionDay", () => {
  it("reads the Europe/Paris date, not the server's", () => {
    expect(competitionDay(new Date("2026-08-20T12:00:00.000Z"))).toBe("2026-08-20");
  });

  it("turns the summer evening over two hours before UTC does", () => {
    expect(competitionDay(new Date("2026-08-20T21:59:59.000Z"))).toBe("2026-08-20");
    expect(competitionDay(new Date("2026-08-20T22:00:00.000Z"))).toBe("2026-08-21");
  });

  it("turns the winter evening one hour before UTC does", () => {
    expect(competitionDay(new Date("2026-01-01T22:59:59.000Z"))).toBe("2026-01-01");
    expect(competitionDay(new Date("2026-01-01T23:00:00.000Z"))).toBe("2026-01-02");
  });
});

describe("daysBefore", () => {
  it("walks back over a month edge", () => {
    expect(daysBefore("2026-08-01", 2)).toBe("2026-07-30");
  });

  it("walks back over the DST change without losing a day", () => {
    expect(daysBefore("2026-03-30", 2)).toBe("2026-03-28");
  });
});

describe("seasonBounds", () => {
  it("spans the whole calendar month the Competition Day falls in", () => {
    expect(seasonBounds("2026-08-20")).toEqual({
      season: "2026-08",
      from: "2026-08-01",
      to: "2026-08-31",
    });
  });

  it("ends a short month on its own last day", () => {
    expect(seasonBounds("2026-02-14").to).toBe("2026-02-28");
    expect(seasonBounds("2028-02-14").to).toBe("2028-02-29");
  });

  it("follows the Europe/Paris day over a month edge UTC has not reached", () => {
    expect(seasonBounds(competitionDay(new Date("2026-08-31T22:30:00.000Z"))).season).toBe(
      "2026-09",
    );
  });
});
