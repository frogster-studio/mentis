// One input, commas as the separator: a batch of variants is typed or pasted in one go.
export function parseChips(input: string): string[] {
  const chips = input.split(",").map((chip) => chip.trim().toLowerCase());
  return [...new Set(chips.filter((chip) => chip !== ""))];
}

export function formatChips(chips: string[]): string {
  return chips.join(", ");
}
