"use client";

import { useEffect, useState } from "react";

export function HeroVideo() {
  const [loadVideo, setLoadVideo] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = (window as Window & typeof globalThis & { requestIdleCallback?: any; cancelIdleCallback?: any }).requestIdleCallback(
        () => setLoadVideo(true)
      );
      return () => (window as Window & typeof globalThis & { cancelIdleCallback?: any }).cancelIdleCallback(id);
    }

    const frame = requestAnimationFrame(() => setLoadVideo(true));
    return () => cancelAnimationFrame(frame);
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
