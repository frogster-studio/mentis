import { describe, expect, it } from "vitest";

import { ANDROID_BETA_URL, APP_STORE_URL, storeDestination } from "./store-links";

const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
const IPAD_LEGACY =
  "Mozilla/5.0 (iPad; CPU OS 12_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.2 Mobile/15E148 Safari/604.1";
const MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15";
const ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36";
const WINDOWS =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";

describe("storeDestination", () => {
  it("sends an iPhone to the App Store", () => {
    expect(storeDestination(IPHONE, 5)).toBe(APP_STORE_URL);
  });

  it("sends an iPad to the App Store, even behind its Mac user agent", () => {
    expect(storeDestination(IPAD_LEGACY, 5)).toBe(APP_STORE_URL);
    expect(storeDestination(MAC, 5)).toBe(APP_STORE_URL);
  });

  it("sends an Android phone to the Android beta section", () => {
    expect(storeDestination(ANDROID, 5)).toBe(ANDROID_BETA_URL);
  });

  it("sends a desktop to the landing page", () => {
    expect(storeDestination(MAC, 0)).toBe("/mentis");
    expect(storeDestination(WINDOWS, 0)).toBe("/mentis");
  });
});
