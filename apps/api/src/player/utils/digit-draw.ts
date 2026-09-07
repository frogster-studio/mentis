import type { DigitDraw } from "../types/digit-draw";
import { PSEUDO_DIGIT_COUNT } from "./pseudo";

export const DIGIT_DRAW = Symbol("DIGIT_DRAW");

export const randomDigitDraw: DigitDraw = () =>
  Math.floor(Math.random() * 10 ** PSEUDO_DIGIT_COUNT);
