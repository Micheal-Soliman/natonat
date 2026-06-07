"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function MetaPixelPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/studio")) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.fbq?.("track", "PageView");
  }, [pathname]);

  return null;
}
