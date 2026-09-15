export type StringStore = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

// Some iOS releases refuse Keychain values above ~2048 bytes, and a Supabase session often exceeds that.
export const CHUNK_SIZE = 1024;

const chunkKey = (key: string, index: number): string => `${key}.${index}`;

const splitIntoChunks = (value: string): string[] => {
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += CHUNK_SIZE) {
    chunks.push(value.slice(offset, offset + CHUNK_SIZE));
  }
  return chunks;
};

const readChunkCount = async (store: StringStore, key: string): Promise<number> => {
  const raw = await store.getItem(key);
  const count = raw === null ? Number.NaN : Number.parseInt(raw, 10);
  return Number.isInteger(count) && count >= 0 ? count : 0;
};

const removeChunks = (store: StringStore, key: string, from: number, to: number): Promise<void[]> =>
  Promise.all(
    Array.from({ length: Math.max(to - from, 0) }, (_, offset) =>
      store.removeItem(chunkKey(key, from + offset)),
    ),
  );

// The key itself holds the chunk count, written last so a crash mid-write leaves the old value readable.
export const createChunkedStorage = (store: StringStore): StringStore => ({
  getItem: async (key) => {
    const count = await readChunkCount(store, key);
    if (count === 0) return null;
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, index) => store.getItem(chunkKey(key, index))),
    );
    return chunks.every((chunk): chunk is string => chunk !== null) ? chunks.join("") : null;
  },
  setItem: async (key, value) => {
    const previousCount = await readChunkCount(store, key);
    const chunks = splitIntoChunks(value);
    await Promise.all(chunks.map((chunk, index) => store.setItem(chunkKey(key, index), chunk)));
    await store.setItem(key, String(chunks.length));
    await removeChunks(store, key, chunks.length, previousCount);
  },
  removeItem: async (key) => {
    const count = await readChunkCount(store, key);
    await store.removeItem(key);
    await removeChunks(store, key, 0, count);
  },
});
