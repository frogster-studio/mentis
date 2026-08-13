// Splits a list into fixed-size batches. Both push paths chunk through this: the API caps every
// batch contract at MAX_PUSH_BATCH and the request body at 64 kb, so a backlog that grew over a long
// offline stretch must arrive in pieces rather than as one rejected wall of rows.

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    batches.push(items.slice(index, index + size));
  }
  return batches;
}
