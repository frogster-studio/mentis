import { ROUTES } from "@/lib/routes";

export const APP_STORE_ID = "6804975526";
export const APP_STORE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
export const ANDROID_BETA_ANCHOR = "android";
export const ANDROID_BETA_URL = `${ROUTES.mentis}#${ANDROID_BETA_ANCHOR}`;

// iPadOS Safari reports a Mac user agent, so only its touch points give it away.
export function storeDestination(userAgent: string, maxTouchPoints: number): string {
  const isIPad = /iPad/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  if (/iPhone|iPod/.test(userAgent) || isIPad) return APP_STORE_URL;
  if (/Android/.test(userAgent)) return ANDROID_BETA_URL;
  return ROUTES.mentis;
}
