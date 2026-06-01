"use client";

import { useEffect, useState } from "react";

export function HeroVideo() {
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const load = () => setLoadVideo(true);

    if (typeof win.requestIdleCallback !== "undefined") {
      idleId = win.requestIdleCallback(() => {
        timeoutId = win.setTimeout(load, 2000);
      });
    } else {
      timeoutId = win.setTimeout(load, 2000);
    }

    return () => {
      if (idleId !== null) {
        win.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <video
      preload="none"
      autoPlay
      muted
      loop
      playsInline
      className="absolute inset-0 w-full h-full object-cover"
    >
      {loadVideo ? <source src="/hero.mp4" type="video/mp4" /> : null}
    </video>
  );
}
