"use client";

export type MetaPixelParams = Record<string, unknown>;

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function trackMetaPixelEvent(event: string, params?: MetaPixelParams) {
  if (typeof window === "undefined" || !window.fbq) return false;

  window.fbq("track", event, params || {});
  return true;
}
