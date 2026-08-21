import type { Clock } from "../types/clock";

export const CLOCK = Symbol("CLOCK");

export const systemClock: Clock = () => new Date();
