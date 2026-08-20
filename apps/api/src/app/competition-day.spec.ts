import { describe, expect, it } from "vitest";
import { competitionDay, daysBefore } from "./competition-day";

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
