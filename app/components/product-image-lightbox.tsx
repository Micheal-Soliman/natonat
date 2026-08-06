"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type ProductImageLightboxProps = {
  images: string[];
  productName: string;
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  labels: {
    close: string;
    previous: string;
    next: string;
    swipe: string;
    goToImage: (number: number) => string;
  };
};

const SWIPE_DISTANCE = 45;

export function ProductImageLightbox({
  images,
  productName,
  open,
  initialIndex,
  onClose,
  labels,
}: ProductImageLightboxProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const count = images.length;
  const activeImage = images[activeIndex];

  const goNext = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((current) => (current + 1) % count);
  }, [count]);

  const goPrevious = useCallback(() => {
    if (count <= 1) return;
    setActiveIndex((current) => (current - 1 + count) % count);
  }, [count]);

  useEffect(() => {
    if (!open) return;

    const normalizedIndex = Math.min(Math.max(initialIndex, 0), Math.max(count - 1, 0));
    const frameId = requestAnimationFrame(() => {
      setActiveIndex(normalizedIndex);
      closeButtonRef.current?.focus();
    });

    return () => cancelAnimationFrame(frameId);
  }, [count, initialIndex, open]);

  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrevious();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [goNext, goPrevious, onClose, open]);

  useEffect(() => {
    if (!open || count <= 1) return;

    const adjacentIndexes = [
      (activeIndex + 1) % count,
      (activeIndex - 1 + count) % count,
    ];

    adjacentIndexes.forEach((index) => {
      const source = images[index];
      if (!source) return;
      const preload = new window.Image();
      preload.decoding = "async";
      preload.src = `/_next/image?url=${encodeURIComponent(source)}&w=1200&q=75`;
    });
  }, [activeIndex, count, images, open]);

  if (!open || !activeImage) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-[rgba(7,17,27,0.98)] backdrop-blur-xl"
      role="dialog"
      aria-modal="true"
      aria-label={productName}
      onClick={onClose}
    >
      <div className="absolute inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 py-3 sm:px-6 sm:py-5">
        <div className="min-w-0 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-white backdrop-blur-md">
          <span className="block truncate text-xs font-black sm:text-sm">{productName}</span>
          <span className="mt-0.5 block text-[10px] font-bold text-white/50">
            {String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
          </span>
        </div>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md transition hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#0F1A26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EEBC3F]"
          aria-label={labels.close}
        >
          <X className="h-5 w-5" strokeWidth={2.3} />
        </button>
      </div>

      <div
        className="flex h-full items-center justify-center px-3 pb-28 pt-20 sm:px-20 sm:pb-32 sm:pt-24"
        onClick={(event) => event.stopPropagation()}
        onPointerDown={(event) => {
          pointerStartRef.current = { x: event.clientX, y: event.clientY };
          event.currentTarget.setPointerCapture?.(event.pointerId);
        }}
        onPointerUp={(event) => {
          const start = pointerStartRef.current;
          pointerStartRef.current = null;
          if (!start) return;

          const distanceX = start.x - event.clientX;
          const distanceY = start.y - event.clientY;
          if (Math.abs(distanceX) < SWIPE_DISTANCE || Math.abs(distanceX) <= Math.abs(distanceY)) return;

          if (distanceX > 0) goNext();
          else goPrevious();
        }}
        onPointerCancel={() => {
          pointerStartRef.current = null;
        }}
      >
        <div className="relative h-full w-full max-w-6xl touch-none select-none overflow-hidden rounded-2xl bg-white/[0.025] sm:rounded-[2rem]">
          <Image
            key={`${activeImage}-${activeIndex}`}
            src={activeImage}
            alt={`${productName} - ${activeIndex + 1}`}
            fill
            sizes="100vw"
            className="animate-in fade-in zoom-in-95 object-contain duration-200"
            draggable={false}
            priority
            quality={75}
          />
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goPrevious();
            }}
            className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md transition hover:bg-white hover:text-[#0F1A26] sm:left-6 sm:h-[52px] sm:w-[52px]"
            aria-label={labels.previous}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              goNext();
            }}
            className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-xl backdrop-blur-md transition hover:bg-white hover:text-[#0F1A26] sm:right-6 sm:h-[52px] sm:w-[52px]"
            aria-label={labels.next}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      {count > 1 && (
        <div
          className="absolute inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-6 sm:pb-5"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-black/25 p-2 shadow-2xl backdrop-blur-xl no-scrollbar sm:gap-3 sm:rounded-3xl sm:p-3">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 bg-white/5 transition sm:h-[72px] sm:w-[72px] ${
                  activeIndex === index
                    ? "border-[#EEBC3F] opacity-100 shadow-lg shadow-[#EEBC3F]/15"
                    : "border-transparent opacity-50 hover:opacity-100"
                }`}
                aria-label={labels.goToImage(index + 1)}
              >
                <Image src={image} alt="" fill sizes="72px" className="object-cover" quality={55} />
              </button>
            ))}
          </div>
        </div>
      )}

      {count > 1 && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-white/8 px-3 py-1.5 text-[10px] font-bold text-white/60 backdrop-blur sm:hidden">
          {labels.swipe}
        </div>
      )}
    </div>,
    document.body,
  );
}
