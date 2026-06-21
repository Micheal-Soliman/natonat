"use client";

import { useEffect, useState } from "react";

export function HowItWorksVideo() {
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
      className="w-full h-full object-contain"
      controls
      autoPlay
      muted
      loop
      playsInline
      preload="none"
    >
      {loadVideo ? <source src="/size.mp4" type="video/mp4" /> : null}
      <track kind="captions" src="/captions/silent-video.vtt" srcLang="en" label="English captions" />
      Your browser does not support the video tag.
    </video>
  );
}
