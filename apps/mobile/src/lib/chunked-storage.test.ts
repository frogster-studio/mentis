import { describe, expect, it } from "vitest";
import { CHUNK_SIZE, createChunkedStorage, type StringStore } from "./chunked-storage";

const memoryStore = (): StringStore & { entries: Map<string, string> } => {
  const entries = new Map<string, string>();
  return {
    entries,
    getItem: async (key) => entries.get(key) ?? null,
    setItem: async (key, value) => {
      entries.set(key, value);
    },
    removeItem: async (key) => {
      entries.delete(key);
    },
  };
};

describe("createChunkedStorage", () => {
  it("returns null for a key never written", async () => {
    const storage = createChunkedStorage(memoryStore());
    expect(await storage.getItem("session")).toBeNull();
  });

  it("round-trips a value longer than one chunk, every chunk under the limit", async () => {
    const store = memoryStore();
    const storage = createChunkedStorage(store);
    const value = "x".repeat(CHUNK_SIZE * 2 + 7);

    await storage.setItem("session", value);

    expect(await storage.getItem("session")).toBe(value);
    expect(store.entries.get("session")).toBe("3");
    for (const [key, chunk] of store.entries) {
      if (key !== "session") expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
  });

  it("round-trips a short value in a single chunk", async () => {
    const store = memoryStore();
    const storage = createChunkedStorage(store);

    await storage.setItem("session", "abc");

    expect(await storage.getItem("session")).toBe("abc");
    expect([...store.entries.keys()]).toEqual(["session.0", "session"]);
  });

  it("drops the stale chunks when a shorter value replaces a longer one", async () => {
    const store = memoryStore();
    const storage = createChunkedStorage(store);
    await storage.setItem("session", "y".repeat(CHUNK_SIZE * 3));

    await storage.setItem("session", "short");

    expect(await storage.getItem("session")).toBe("short");
    expect([...store.entries.keys()].sort()).toEqual(["session", "session.0"]);
  });

  it("removes the count and every chunk", async () => {
    const store = memoryStore();
    const storage = createChunkedStorage(store);
    await storage.setItem("session", "z".repeat(CHUNK_SIZE + 1));

    await storage.removeItem("session");

    expect(store.entries.size).toBe(0);
    expect(await storage.getItem("session")).toBeNull();
  });

  it("answers null rather than a truncated value when a chunk is missing", async () => {
    const store = memoryStore();
    const storage = createChunkedStorage(store);
    await storage.setItem("session", "w".repeat(CHUNK_SIZE + 1));
    store.entries.delete("session.1");

    expect(await storage.getItem("session")).toBeNull();
  });

  it("treats a corrupt count as empty", async () => {
    const store = memoryStore();
    store.entries.set("session", "not-a-number");
    const storage = createChunkedStorage(store);

    expect(await storage.getItem("session")).toBeNull();
  });
});
