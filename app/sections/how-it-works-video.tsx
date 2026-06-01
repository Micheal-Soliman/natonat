"use client";

import { useEffect, useState } from "react";

export function HowItWorksVideo() {
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const idleCallback = (window as Window & typeof globalThis & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    }).requestIdleCallback;

    if (idleCallback) {
      const id = idleCallback(() => setLoadVideo(true));
      return () => {
        (window as Window & typeof globalThis & {
          cancelIdleCallback?: (id: number) => void;
        }).cancelIdleCallback?.(id);
      };
    }

    const frame = requestAnimationFrame(() => setLoadVideo(true));
    return () => cancelAnimationFrame(frame);
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
      Your browser does not support the video tag.
    </video>
  );
}
