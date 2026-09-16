const key = (id: string) => `theme-image-cleanup:v1:${id}`;

export function pendingImageCleanup(id: string): string[] {
  try {
    const tokens: unknown = JSON.parse(localStorage.getItem(key(id)) ?? "[]");
    return Array.isArray(tokens)
      ? tokens.filter((token): token is string => typeof token === "string")
      : [];
  } catch {
    return [];
  }
}

export function storeImageCleanup(id: string, tokens: string[]): void {
  try {
    if (tokens.length) localStorage.setItem(key(id), JSON.stringify(tokens));
    else localStorage.removeItem(key(id));
  } catch {
    /* Private browsing can disable storage; the current page still offers a retry. */
  }
}
