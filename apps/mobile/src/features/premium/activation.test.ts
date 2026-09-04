import { describe, expect, it, vi } from "vitest";
import { type ActivationPollDeps, pollUntilActive } from "./activation";
import { ACTIVATION_POLL_INTERVAL_MS, ACTIVATION_TIMEOUT_MS } from "./constants";

const T0 = 1_760_000_000_000;
const READS_IN_A_FULL_WINDOW = ACTIVATION_TIMEOUT_MS / ACTIVATION_POLL_INTERVAL_MS + 1;

function clock() {
  let elapsed = 0;
  return {
    now: () => T0 + elapsed,
    wait: async (ms: number) => {
      elapsed += ms;
    },
    elapsed: () => elapsed,
  };
}

function reader(reads: (boolean | Error)[]): ActivationPollDeps["readIsActive"] {
  let index = 0;
  return vi.fn(async () => {
    const read = reads[Math.min(index, reads.length - 1)];
    index += 1;
    if (read instanceof Error) {
      throw read;
    }
    return read;
  });
}

describe("pollUntilActive", () => {
  it("is active on the first read when the mirror already carries the entitlement", async () => {
    const time = clock();
    const readIsActive = reader([true]);

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      true,
    );
    expect(readIsActive).toHaveBeenCalledTimes(1);
    expect(time.elapsed()).toBe(0);
  });

  it("waits the poll interval between reads until the webhook lands", async () => {
    const time = clock();
    const readIsActive = reader([false, false, true]);

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      true,
    );
    expect(readIsActive).toHaveBeenCalledTimes(3);
    expect(time.elapsed()).toBe(2 * ACTIVATION_POLL_INTERVAL_MS);
  });

  it("gives up once the window is spent, without exceeding it", async () => {
    const time = clock();
    const readIsActive = reader([false]);

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      false,
    );
    expect(time.elapsed()).toBe(ACTIVATION_TIMEOUT_MS);
    expect(readIsActive).toHaveBeenCalledTimes(READS_IN_A_FULL_WINDOW);
  });

  it("keeps polling through a failed read", async () => {
    const time = clock();
    const readIsActive = reader([new Error("offline"), true]);

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      true,
    );
    expect(time.elapsed()).toBe(ACTIVATION_POLL_INTERVAL_MS);
  });

  it("times out rather than throwing when every read fails", async () => {
    const time = clock();
    const readIsActive = reader([new Error("offline")]);

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      false,
    );
  });

  it("counts the window from the first read, so slow reads never stretch it", async () => {
    const time = clock();
    const readIsActive = vi.fn(async () => {
      await time.wait(ACTIVATION_TIMEOUT_MS);
      return false;
    });

    await expect(pollUntilActive({ readIsActive, now: time.now, wait: time.wait })).resolves.toBe(
      false,
    );
    expect(readIsActive).toHaveBeenCalledTimes(1);
  });
});
