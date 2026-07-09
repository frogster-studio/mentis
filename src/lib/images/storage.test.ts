import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { CARD_IMAGES_BUCKET, removeCardImages } from "@/lib/images/storage";

// In-memory double of the slice of the storage API the helper uses:
// storage.from(bucket).remove(paths).
function createFakeStorage(options?: { removeError?: string }) {
  const removals: { bucket: string; paths: string[] }[] = [];
  const client = {
    storage: {
      from(bucket: string) {
        return {
          async remove(paths: string[]) {
            if (options?.removeError) {
              return { data: null, error: { message: options.removeError } };
            }
            removals.push({ bucket, paths });
            return { data: [], error: null };
          },
        };
      },
    },
  };
  return { client: client as unknown as SupabaseClient, removals };
}

describe("removeCardImages", () => {
  it("requests deletion of every given object from the Card Images bucket", async () => {
    const { client, removals } = createFakeStorage();

    await removeCardImages(client, ["a.webp", "b.webp"]);

    expect(removals).toEqual([
      { bucket: CARD_IMAGES_BUCKET, paths: ["a.webp", "b.webp"] },
    ]);
  });

  it("makes no request for an empty list", async () => {
    const { client, removals } = createFakeStorage();

    await removeCardImages(client, []);

    expect(removals).toEqual([]);
  });

  it("surfaces a removal failure as an error", async () => {
    const { client } = createFakeStorage({ removeError: "boom" });

    await expect(removeCardImages(client, ["a.webp"])).rejects.toThrow(
      "Failed to remove Card Images: boom",
    );
  });
});
