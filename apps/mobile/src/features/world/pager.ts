export const FIRST_PAGE = 1;

// A Season nobody is ranked in still shows its first page, with every pager control resting disabled.
export function clampPage(page: number, pageCount: number): number {
  if (pageCount < FIRST_PAGE) {
    return FIRST_PAGE;
  }
  return Math.min(Math.max(page, FIRST_PAGE), pageCount);
}
