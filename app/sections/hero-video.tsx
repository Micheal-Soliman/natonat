"use client";

import { useEffect, useState } from "react";

const DESKTOP_VIDEO_LOAD_DELAY_MS = 1800;
const MOBILE_VIDEO_LOAD_DELAY_MS = 10000;

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
    let hasLoaded = false;

    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    const loadDelay = isMobile ? MOBILE_VIDEO_LOAD_DELAY_MS : DESKTOP_VIDEO_LOAD_DELAY_MS;
    const removeInteractionListeners = () => {
      window.removeEventListener("pointerdown", load);
      window.removeEventListener("touchstart", load);
      window.removeEventListener("scroll", load);
      window.removeEventListener("keydown", load);
    };
    const load = () => {
      if (hasLoaded) return;
      hasLoaded = true;
      removeInteractionListeners();
      setLoadVideo(true);
    };

    window.addEventListener("pointerdown", load, { passive: true, once: true });
    window.addEventListener("touchstart", load, { passive: true, once: true });
    window.addEventListener("scroll", load, { passive: true, once: true });
    window.addEventListener("keydown", load, { once: true });

    if (typeof win.requestIdleCallback !== "undefined") {
      idleId = win.requestIdleCallback(() => {
        timeoutId = win.setTimeout(load, loadDelay);
      });
    } else {
      timeoutId = win.setTimeout(load, loadDelay);
    }

    return () => {
      if (idleId !== null) {
        win.cancelIdleCallback?.(idleId);
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
      }
      removeInteractionListeners();
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
