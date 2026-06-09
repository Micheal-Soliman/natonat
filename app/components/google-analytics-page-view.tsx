"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const measurementId = "G-MBR1BZMFVE";

export function GoogleAnalyticsPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/studio")) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag =
      window.gtag ||
      ((...args: unknown[]) => {
        window.dataLayer?.push(args);
      });

    if (isFirstRender.current) {
      isFirstRender.current = false;
      window.gtag("js", new Date());
      window.gtag("config", measurementId);
      return;
    }

    window.gtag?.("config", measurementId, {
      page_path: pathname,
    });
  }, [pathname]);

  return null;
}
