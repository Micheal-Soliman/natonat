"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export type ReviewImage = {
  id: number;
  fileName: string;
  src: string;
  alt: string;
};

type ReviewsLightboxProps = {
  images: ReviewImage[];
  open: boolean;
  initialIndex: number;
  onClose: () => void;
};

export function ReviewsLightbox({
  images,
  open,
  initialIndex,
  onClose,
}: ReviewsLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const count = images.length;
  const activeImage = images[activeIndex];

  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex);
    }
  }, [open, initialIndex]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }

      if (event.key === "ArrowRight") {
        goNext();
      }

      if (event.key === "ArrowLeft") {
        goPrev();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, goNext, goPrev]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    setTouchEnd(null);
    setTouchStart(event.targetTouches[0].clientX);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    setTouchEnd(event.targetTouches[0].clientX);
  }

  function handleTouchEnd() {
    if (touchStart === null || touchEnd === null) return;

    const minSwipeDistance = 50;
    const distance = touchStart - touchEnd;

    if (distance > minSwipeDistance) {
      goNext();
    }

    if (distance < -minSwipeDistance) {
      goPrev();
    }
  }

  if (!open || !activeImage) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#0F1A26]/95 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      {/* Top Bar */}
      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
          {activeIndex + 1} / {count}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white hover:text-[#0F1A26]"
          aria-label="Close reviews gallery"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      {/* Main Image */}
      <div
        className="flex h-full items-center justify-center px-4 py-20 sm:px-16"
        onClick={(event) => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative h-full w-full max-w-5xl">
          <Image
            src={activeImage.src}
            alt={activeImage.alt}
            fill
            sizes="100vw"
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Desktop Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrev();
            }}
            className="absolute left-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-[#0F1A26] md:flex"
            aria-label="Previous review"
          >
            <ChevronLeft className="h-7 w-7" />
          </button>

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className="absolute right-4 top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white hover:text-[#0F1A26] md:flex"
            aria-label="Next review"
          >
            <ChevronRight className="h-7 w-7" />
          </button>
        </>
      )}

      {/* Bottom Thumbnails */}
      {count > 1 && (
        <div
          className="absolute bottom-0 left-0 right-0 z-20 px-4 pb-4"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex max-w-5xl gap-2 overflow-x-auto rounded-2xl bg-black/20 p-2 backdrop-blur">
            {images.map((image, index) => (
              <button
                key={image.src}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-16 w-12 shrink-0 overflow-hidden rounded-lg border transition sm:h-20 sm:w-16 ${
                  activeIndex === index
                    ? "border-[#EEBC3F] opacity-100"
                    : "border-white/20 opacity-55 hover:opacity-100"
                }`}
                aria-label={`Open review ${index + 1}`}
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Hint */}
      {count > 1 && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white/10 px-4 py-2 text-xs font-medium text-white/70 backdrop-blur md:hidden">
          Swipe left or right
        </div>
      )}
    </div>
  );
}