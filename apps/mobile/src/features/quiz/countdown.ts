// The timer is an absolute wall-clock end-timestamp, so it survives backgrounding and throttling.

import { COUNTDOWN_DURATION_MS } from "./constants";

export function endTimestamp(now: number): number {
  return now + COUNTDOWN_DURATION_MS;
}

export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

// Ceil so the display reaches 0 only once the Countdown has truly expired.
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.ceil(remainingMs(endsAt, now) / 1000);
}

// Share of the Countdown still ahead, in [0, 1] — drives the ring's arc.
export function remainingFraction(endsAt: number, now: number): number {
  return Math.min(1, remainingMs(endsAt, now) / COUNTDOWN_DURATION_MS);
}

export function isExpired(endsAt: number, now: number): boolean {
  return now >= endsAt;
}

// How long the Question stood before the answer — the stamp a competition batch carries.
export function elapsedMs(endsAt: number, now: number): number {
  return Math.max(0, COUNTDOWN_DURATION_MS - remainingMs(endsAt, now));
}
