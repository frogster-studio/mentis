// Null until a Pseudo is loaded, so the avatar falls back to its neutral dot rather than a blank circle.
export function profileInitial(pseudo: string | undefined): string | null {
  const first = pseudo?.trim().charAt(0);
  return first === undefined || first === "" ? null : first.toUpperCase();
}
