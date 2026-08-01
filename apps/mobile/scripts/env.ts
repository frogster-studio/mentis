// Reads a required variable from the git-ignored .env file (bun auto-loads it).
export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} — add it to the git-ignored .env file at the repo root`);
  }
  return value;
}
