// Server truth trails the store receipt by seconds, so the purchase waits on it rather than guess.

import { ACTIVATION_POLL_INTERVAL_MS, ACTIVATION_TIMEOUT_MS } from "./constants";

export interface ActivationPollDeps {
  readIsActive: () => Promise<boolean>;
  now: () => number;
  wait: (ms: number) => Promise<void>;
}

export async function pollUntilActive({
  readIsActive,
  now,
  wait,
}: ActivationPollDeps): Promise<boolean> {
  const deadline = now() + ACTIVATION_TIMEOUT_MS;

  while (true) {
    // A failed read is only a read server truth has not answered yet, never the end of the wait.
    if (await readIsActive().catch(() => false)) {
      return true;
    }
    if (now() + ACTIVATION_POLL_INTERVAL_MS > deadline) {
      return false;
    }
    await wait(ACTIVATION_POLL_INTERVAL_MS);
  }
}
