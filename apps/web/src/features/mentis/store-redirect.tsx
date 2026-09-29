"use client";

import { useEffect } from "react";

import { storeDestination } from "./store-links";

export function StoreRedirect() {
  useEffect(() => {
    window.location.replace(storeDestination(navigator.userAgent, navigator.maxTouchPoints));
  }, []);
  return null;
}
