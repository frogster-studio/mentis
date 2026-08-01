import { describe, expect, it } from "vitest";
import { type AccountSession, foldAccountStats } from "./account-stats";
import {
  entriesForOwner,
  type Outbox,
  type OutboxEntry,
  outboxReducer,
  overlaySessions,
  toAccountSession,
} from "./outbox";

const OWNER = "owner-a";
const OTHER = "owner-b";

function entry(overrides: Partial<OutboxEntry> = {}): OutboxEntry {
  return {
    id: "session-1",
    owner: OWNER,
    themeId: "geo",
    themeName: "Géographie",
    points: 35,
    finishedAt: "2026-07-22T10:00:00.000Z",
    ...overrides,
  };
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
    const state = [
      entry({ id: "s1", owner: OWNER }),
      entry({ id: "s2", owner: OTHER }),
      entry({ id: "s3", owner: OWNER }),
    ];
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
    const state = [
      entry({ id: "s1", owner: OWNER }),
      entry({ id: "s2", owner: OTHER }),
      entry({ id: "s3", owner: OWNER }),
    ];
    expect(entriesForOwner(state, OWNER).map((x) => x.id)).toStrictEqual(["s1", "s3"]);
  });

  it("is empty for an owner with nothing queued", () => {
    expect(entriesForOwner([entry({ owner: OTHER })], OWNER)).toStrictEqual([]);
  });
});

describe("toAccountSession — the overlay shape", () => {
  it("maps a queued entry to the AccountSession the fold overlays", () => {
    expect(
      toAccountSession(entry({ themeId: "geo", themeName: "Géographie", points: 35 })),
    ).toStrictEqual({ themeId: "geo", themeName: "Géographie", points: 35 });
  });
});

describe("overlaySessions — the id-reconciled optimistic overlay", () => {
  it("maps the owner’s pending rows to the fold shape when nothing is synced yet", () => {
    const state = [
      entry({ id: "s1", themeId: "geo", themeName: "Géographie", points: 30 }),
      entry({ id: "s2", themeId: "simpson", themeName: "Les Simpson", points: 40 }),
    ];
    expect(overlaySessions(state, OWNER, new Set())).toStrictEqual([
      { themeId: "geo", themeName: "Géographie", points: 30 },
      { themeId: "simpson", themeName: "Les Simpson", points: 40 },
    ]);
  });

  it("drops a pending row a pull has already landed, so a session in flight counts once", () => {
    const state = [entry({ id: "s1", points: 30 }), entry({ id: "s2", points: 40 })];
    // s1 already sits in the synced pull → only s2 stays on the overlay.
    expect(overlaySessions(state, OWNER, new Set(["s1"]))).toStrictEqual([
      { themeId: "geo", themeName: "Géographie", points: 40 },
    ]);
  });

  it("never overlays another Account’s rows", () => {
    const state = [entry({ id: "s1", owner: OTHER }), entry({ id: "s2", owner: OWNER })];
    expect(overlaySessions(state, OWNER, new Set())).toStrictEqual([
      { themeId: "geo", themeName: "Géographie", points: 35 },
    ]);
  });

  it("is empty once every pending row is synced", () => {
    const state = [entry({ id: "s1" }), entry({ id: "s2" })];
    expect(overlaySessions(state, OWNER, new Set(["s1", "s2"]))).toStrictEqual([]);
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
    // The strong invariant tying the outbox to the fold: at every step, fold(synced ∪ pending)
    // equals fold(all finished sessions). A session is pending until its push is acked and synced
    // after — never both (a double-count), never neither (a lost session). `ackBatch` mirrors the
    // wiring exactly: it moves only the rows the ack actually removed into `synced`, so a replayed
    // ack (a forced double-push) can neither re-seed a row nor drop it twice.
    const finished: OutboxEntry[] = [
      entry({ id: "s1", themeId: "geo", themeName: "Géographie", points: 30 }),
      entry({ id: "s2", themeId: "geo", themeName: "Géographie", points: 20 }),
      entry({ id: "s3", themeId: "simpson", themeName: "Les Simpson", points: 40 }),
    ];
    const truth = foldAccountStats([], finished.map(toAccountSession), []);

    let queue: Outbox = [];
    const synced: AccountSession[] = [];
    const assertConserved = () =>
      expect(
        foldAccountStats([], synced, entriesForOwner(queue, OWNER).map(toAccountSession)),
      ).toStrictEqual(truth);
    const ackBatch = (ids: string[]) => {
      const removed = queue.filter((e) => ids.includes(e.id));
      queue = outboxReducer(queue, { type: "ack", ids });
      synced.push(...removed.map(toAccountSession));
    };

    for (const e of finished) {
      queue = outboxReducer(queue, { type: "enqueue", entry: e });
    }
    assertConserved(); // all three pending, none synced

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
