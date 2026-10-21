export const DEFAULT_LIST_WIDTHS_REM = [13, 19.5, 26];
const LIST_MIN_WIDTH_REM = 10;
export const DETAILS_MIN_WIDTH_REM = 20;
export const KEYBOARD_STEP_REM = 1;

const STORAGE_KEY = "resizable-columns:v1";

export const minWidthOf = (index: number, columnCount: number): number =>
  index === columnCount - 1 ? DETAILS_MIN_WIDTH_REM : LIST_MIN_WIDTH_REM;

export const minTotalWidth = (columnCount: number): number =>
  LIST_MIN_WIDTH_REM * (columnCount - 1) + DETAILS_MIN_WIDTH_REM;

const sum = (widths: number[]): number => widths.reduce((total, width) => total + width, 0);

const shrinkInOrder = (widths: number[], order: number[], amount: number) => {
  const shrunk = [...widths];
  let remaining = amount;
  for (const index of order) {
    const taken = Math.min(
      remaining,
      Math.max(0, shrunk[index] - minWidthOf(index, widths.length)),
    );
    shrunk[index] -= taken;
    remaining -= taken;
  }
  return { widths: shrunk, taken: amount - remaining };
};

const indicesBetween = (from: number, to: number): number[] =>
  from <= to
    ? Array.from({ length: to - from + 1 }, (_, offset) => from + offset)
    : Array.from({ length: from - to + 1 }, (_, offset) => from - offset);

export const moveBoundary = (widths: number[], handle: number, delta: number): number[] => {
  const movesRight = delta > 0;
  const order = movesRight
    ? indicesBetween(handle + 1, widths.length - 1)
    : indicesBetween(handle, 0);
  const { widths: moved, taken } = shrinkInOrder(widths, order, Math.abs(delta));
  moved[movesRight ? handle : handle + 1] += taken;
  return moved;
};

// Squeezing is display-only, so a wider window gives the chosen widths back.
export const fitToWidth = (listWidths: number[], availableWidth: number): number[] => {
  const deficit = Math.max(0, DETAILS_MIN_WIDTH_REM - (availableWidth - sum(listWidths)));
  const fittedLists = shrinkInOrder(
    [...listWidths, DETAILS_MIN_WIDTH_REM],
    indicesBetween(listWidths.length - 1, 0),
    deficit,
  ).widths.slice(0, -1);
  return [...fittedLists, Math.max(DETAILS_MIN_WIDTH_REM, availableWidth - sum(fittedLists))];
};

export const boundaryOffset = (widths: number[], handle: number): number =>
  sum(widths.slice(0, handle + 1));

export const maxWidthOf = (widths: number[], index: number): number =>
  widths[index] +
  sum(
    indicesBetween(index + 1, widths.length - 1).map(
      (right) => widths[right] - minWidthOf(right, widths.length),
    ),
  );

export const readListWidths = (): number[] => {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    const isValid =
      Array.isArray(stored) &&
      stored.length === DEFAULT_LIST_WIDTHS_REM.length &&
      stored.every((width) => Number.isFinite(width) && width >= LIST_MIN_WIDTH_REM);
    return isValid ? stored : DEFAULT_LIST_WIDTHS_REM;
  } catch {
    return DEFAULT_LIST_WIDTHS_REM;
  }
};

export const storeListWidths = (listWidths: number[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(listWidths));
  } catch {
    /* Private browsing can disable storage; the widths then last until reload. */
  }
};
