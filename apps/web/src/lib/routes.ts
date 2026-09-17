export const ROUTES = {
  home: "/",
  mentis: "/mentis",
  legal: "/legal",
  privacy: "/mentis/privacy",
  terms: "/mentis/terms",
  support: "/mentis/support",
  deleteAccount: "/mentis/delete-account",
} as const;

export const PAGE_PATHS: readonly string[] = Object.values(ROUTES);
