import { describe, expect, it } from "vitest";
import type { Category } from "@/types/quiz";
import {
  accountTallies,
  entriesForOwner,
  type Outbox,
  type OutboxEntry,
  outboxPracticeDays,
  outboxReducer,
  pushRow,
  withAckedSessions,
  withPracticeSessions,
} from "./outbox";
import type { ThemeTally } from "./theme-tallies";

const OWNER = "owner-a";
const OTHER = "owner-b";

const GEOGRAPHIE: Category = {
  id: "geographie",
  name: "Géographie",
  color: "#1565c0",
  secondaryColor: "#e3f2fd",
  icon: "public",
};

const NO_COMPETITION: ThemeTally["competition"] = {
  attemptCount: 0,
  judgedCount: 0,
  totalPoints: 0,
  bestScore: null,
};

function practiceTally(
  themeId: string,
  themeName: string,
  practice: ThemeTally["practice"],
): ThemeTally {
  return { themeId, themeName, category: GEOGRAPHIE, practice, competition: NO_COMPETITION };
}

function entry(overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    id: "session-1",
    owner: OWNER,
    themeId: "geo",
    themeName: "Géographie",
    category: GEOGRAPHIE,
    points: 35,
    finishedAt: "2026-07-22T10:00:00.000Z",
    ...overrides,
  };
}

function mixedOwners(): OutboxEntry[] {
  return [
    entry({ id: "s1", owner: OWNER }),
    entry({ id: "s2", owner: OTHER }),
    entry({ id: "s3", owner: OWNER }),
  ];
}

describe("enqueue", () => {
  it("appends a finished session, owner-tagged, with the injected id and timestamp intact", () => {
    const e = entry();
    expect(outboxReducer([], { type: "enqueue", entry: e })).toStrictEqual([e]);
  });

  it("appends in finish order (oldest first)", () => {
    const first = entry({ id: "s1", finishedAt: "2026-07-22T10:00:00.000Z" });
    const second = entry({ id: "s2", finishedAt: "2026-07-22T10:05:00.000Z" });
    const state = outboxReducer(outboxReducer([], { type: "enqueue", entry: first }), {
      type: "enqueue",
      entry: second,
    });
    expect(state.map((x) => x.id)).toStrictEqual(["s1", "s2"]);
  });

  it("is keyed by id: a replayed finish never queues the same session twice", () => {
    const e = entry();
    const once = outboxReducer([], { type: "enqueue", entry: e });
    expect(outboxReducer(once, { type: "enqueue", entry: e })).toBe(once);
  });
});

describe("ack — push success drains a batch, failure retains the rest", () => {
  it("drops exactly the acked ids and keeps the rest queued (retention on partial failure)", () => {
    const state = [entry({ id: "s1" }), entry({ id: "s2" }), entry({ id: "s3" })];
    // Only s1 and s3 landed; s2's push failed and stays for the next trigger.
    expect(outboxReducer(state, { type: "ack", ids: ["s1", "s3"] }).map((x) => x.id)).toStrictEqual(
      ["s2"],
    );
  });

  it("ignores unknown ids: a stale ack is harmless", () => {
    const state = [entry({ id: "s1" })];
    expect(outboxReducer(state, { type: "ack", ids: ["nope"] })).toStrictEqual(state);
  });

  it("is idempotent: acking the same batch twice removes it once (a forced double-push)", () => {
    const state = [entry({ id: "s1" }), entry({ id: "s2" })];
    const once = outboxReducer(state, { type: "ack", ids: ["s1", "s2"] });
    const twice = outboxReducer(once, { type: "ack", ids: ["s1", "s2"] });
    expect(once).toStrictEqual([]);
    expect(twice).toStrictEqual(once);
  });
});

describe("discardOwner — the owner no longer exists", () => {
  it("drops every row of that Account and keeps the others", () => {
    const state = mixedOwners();
    expect(
      outboxReducer(state, { type: "discardOwner", owner: OWNER }).map((x) => x.id),
    ).toStrictEqual(["s2"]);
  });

  it("is total: nothing of the deleted owner survives", () => {
    const state = [entry({ id: "s1", owner: OWNER }), entry({ id: "s2", owner: OWNER })];
    expect(outboxReducer(state, { type: "discardOwner", owner: OWNER })).toStrictEqual([]);
  });
});

describe("entriesForOwner — the drained batch and the fold overlay", () => {
  it("selects only the given owner’s rows, in finish order", () => {
    const state = mixedOwners();
    expect(entriesForOwner(state, OWNER).map((x) => x.id)).toStrictEqual(["s1", "s3"]);
  });

  it("is empty for an owner with nothing queued", () => {
    expect(entriesForOwner([entry({ owner: OTHER })], OWNER)).toStrictEqual([]);
  });
});

describe("pushRow — the push body", () => {
  it("carries neither the owner nor the captured Category", () => {
    expect(pushRow(entry())).toStrictEqual({
      id: "session-1",
      themeId: "geo",
      themeName: "Géographie",
      points: 35,
      finishedAt: "2026-07-22T10:00:00.000Z",
    });
  });
});

describe("withPracticeSessions — a session folds into its Theme's practice", () => {
  it("moves the count, the points and the best of the Theme's row", () => {
    const themes = [
      practiceTally("geo", "Géographie", { sessionCount: 2, totalPoints: 60, bestScore: 30 }),
    ];
    expect(
      withPracticeSessions(themes, [entry({ points: 40 }), entry({ points: 10 })]),
    ).toStrictEqual([
      practiceTally("geo", "Géographie", { sessionCount: 4, totalPoints: 110, bestScore: 40 }),
    ]);
  });

  it("gives a Theme whose best is unknown the session's points as its best", () => {
    const themes = [
      practiceTally("geo", "Géographie", { sessionCount: 3, totalPoints: 90, bestScore: null }),
    ];
    expect(withPracticeSessions(themes, [entry({ points: 20 })])[0]?.practice.bestScore).toBe(20);
  });

  it("keeps the Account's name, Category and competition figures on a known Theme", () => {
    const competition = { attemptCount: 2, judgedCount: 1, totalPoints: 30, bestScore: 30 };
    const themes: ThemeTally[] = [
      {
        themeId: "geo",
        themeName: "Géographie du monde",
        category: null,
        practice: { sessionCount: 0, totalPoints: 0, bestScore: null },
        competition,
      },
    ];
    expect(withPracticeSessions(themes, [entry({ points: 25 })])).toStrictEqual([
      {
        themeId: "geo",
        themeName: "Géographie du monde",
        category: null,
        practice: { sessionCount: 1, totalPoints: 25, bestScore: 25 },
        competition,
      },
    ]);
  });

  it("creates the row of a Theme the Account lacks, with the entry's captured Category", () => {
    expect(
      withPracticeSessions([], [entry({ themeId: "alpes", themeName: "Les Alpes", points: 15 })]),
    ).toStrictEqual([
      practiceTally("alpes", "Les Alpes", { sessionCount: 1, totalPoints: 15, bestScore: 15 }),
    ]);
  });

  it("never mutates the Account's tallies", () => {
    const themes = [
      practiceTally("geo", "Géographie", { sessionCount: 1, totalPoints: 10, bestScore: 10 }),
    ];
    const snapshot = structuredClone(themes);
    withPracticeSessions(themes, [entry()]);
    expect(themes).toStrictEqual(snapshot);
  });
});

describe("accountTallies — the Account's themes overlaid with its pending sessions", () => {
  it("overlays only the owner's pending sessions", () => {
    const state = [
      entry({ id: "s1", owner: OTHER, points: 50 }),
      entry({ id: "s2", owner: OWNER, points: 30 }),
    ];
    expect(accountTallies([], state, OWNER)).toStrictEqual([
      practiceTally("geo", "Géographie", { sessionCount: 1, totalPoints: 30, bestScore: 30 }),
    ]);
  });

  it("is the Account's themes as read when nothing is pending", () => {
    const themes = [
      practiceTally("geo", "Géographie", { sessionCount: 1, totalPoints: 10, bestScore: 10 }),
    ];
    expect(accountTallies(themes, [], OWNER)).toStrictEqual(themes);
  });
});

describe("outboxPracticeDays — the Practice Streak overlay", () => {
  it("dates each pending session on its Paris day", () => {
    const late = entry({ id: "late", finishedAt: "2026-03-31T23:30:00.000Z" });
    expect(outboxPracticeDays([entry(), late])).toStrictEqual(["2026-07-22", "2026-04-01"]);
  });
});

describe("withAckedSessions — the Account world an ack seeds", () => {
  const stats = {
    themes: [
      practiceTally("geo", "Géographie", { sessionCount: 1, totalPoints: 30, bestScore: 30 }),
    ],
    practiceStreak: { lastDay: "2026-07-21", length: 2, longest: 4 },
    competitionStreak: { lastDay: null, length: 0, longest: 0 },
  };

  it("folds the acked session into its Theme and extends the Practice Streak with its Paris day", () => {
    const seeded = withAckedSessions(stats, [entry({ points: 40 })]);
    expect(seeded.themes).toStrictEqual([
      practiceTally("geo", "Géographie", { sessionCount: 2, totalPoints: 70, bestScore: 40 }),
    ]);
    expect(seeded.practiceStreak).toStrictEqual({ lastDay: "2026-07-22", length: 3, longest: 4 });
    expect(seeded.competitionStreak).toBe(stats.competitionStreak);
  });
});

describe("purity", () => {
  it("never mutates the previous queue", () => {
    const state = [entry({ id: "s1" }), entry({ id: "s2", owner: OTHER })];
    const snapshot = structuredClone(state);
    outboxReducer(state, { type: "enqueue", entry: entry({ id: "s3" }) });
    outboxReducer(state, { type: "ack", ids: ["s1"] });
    outboxReducer(state, { type: "discardOwner", owner: OTHER });
    expect(state).toStrictEqual(snapshot);
  });
});

describe("replay-idempotence invariant — a flaky push never corrupts totals", () => {
  it("reduces every transition to the same queue when replayed", () => {
    const base = [entry({ id: "s1" }), entry({ id: "s2" })];
    const e = entry({ id: "s3" });
    const enqueued = outboxReducer(base, { type: "enqueue", entry: e });
    expect(outboxReducer(enqueued, { type: "enqueue", entry: e })).toStrictEqual(enqueued);
    const acked = outboxReducer(base, { type: "ack", ids: ["s1"] });
    expect(outboxReducer(acked, { type: "ack", ids: ["s1"] })).toStrictEqual(acked);
    const discarded = outboxReducer(base, { type: "discardOwner", owner: OWNER });
    expect(outboxReducer(discarded, { type: "discardOwner", owner: OWNER })).toStrictEqual(
      discarded,
    );
  });

  it("conserves totals through an ugly network dance: each session counts once — never twice, never zero", () => {
    // At every step the acked tallies overlaid with the queue must equal every finished session.
    const finished: OutboxEntry[] = [
      entry({ id: "s1", themeId: "geo", themeName: "Géographie", points: 30 }),
      entry({ id: "s2", themeId: "geo", themeName: "Géographie", points: 20 }),
      entry({ id: "s3", themeId: "simpson", themeName: "Les Simpson", points: 40 }),
    ];
    const truth = withPracticeSessions([], finished);

    let queue: Outbox = [];
    let acked: ThemeTally[] = [];
    const assertConserved = () => expect(accountTallies(acked, queue, OWNER)).toStrictEqual(truth);
    const ackBatch = (ids: string[]) => {
      const removed = queue.filter((e) => ids.includes(e.id));
      queue = outboxReducer(queue, { type: "ack", ids });
      acked = withPracticeSessions(acked, removed);
    };

    for (const e of finished) {
      queue = outboxReducer(queue, { type: "enqueue", entry: e });
    }
    assertConserved(); // all three pending, none acked

    ackBatch([]); // a failed push acks nothing → pure retention
    assertConserved();
    ackBatch(["s1"]); // a partial success
    assertConserved();
    ackBatch(["s1"]); // a forced double-push of s1 — already gone, a no-op
    assertConserved();
    ackBatch(["s2", "s3"]); // the rest land
    assertConserved();
    ackBatch(["s1", "s2", "s3"]); // replay the whole thing once more
    assertConserved();

    expect(queue).toStrictEqual([]);
  });
});
