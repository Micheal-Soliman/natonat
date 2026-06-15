"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    ttq?: {
      page?: () => void;
      track?: (event: string, params?: Record<string, unknown>) => void;
    };
  }
}

export function TikTokPixelPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/studio")) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.ttq?.page?.();
  }, [pathname]);

  return null;
}
