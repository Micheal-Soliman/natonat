"use client";

import { useEffect, useState } from "react";

const VIDEO_LOAD_DELAY_MS = 1800;

export function HeroVideo() {
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("connection" in navigator) {
      const connection = navigator.connection as { saveData?: boolean } | undefined;
      if (connection?.saveData) return;
    }

    const win = window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | null = null;
    let timeoutId: number | null = null;

    const load = () => setLoadVideo(true);

    if (typeof win.requestIdleCallback !== "undefined") {
      idleId = win.requestIdleCallback(() => {
        timeoutId = win.setTimeout(load, VIDEO_LOAD_DELAY_MS);
      });
    } else {
      timeoutId = win.setTimeout(load, VIDEO_LOAD_DELAY_MS);
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
      disablePictureInPicture
      className="absolute inset-0 w-full h-full object-cover"
    >
      {loadVideo ? <source src="/hero.mp4" type="video/mp4" /> : null}
      <track kind="captions" src="/captions/silent-video.vtt" srcLang="en" label="English captions" />
    </video>
  );
}
