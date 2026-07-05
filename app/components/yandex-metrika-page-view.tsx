"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    ym?: (...args: unknown[]) => void;
  }
}

const yandexMetrikaId = Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID || "110397858");

export function YandexMetrikaPageView() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (pathname.startsWith("/studio")) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    window.ym?.(yandexMetrikaId, "hit", window.location.href, {
      referrer: document.referrer,
      title: document.title,
    });
  }, [pathname]);

  return null;
}
