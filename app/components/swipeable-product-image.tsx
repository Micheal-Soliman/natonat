"use client";

import { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Product } from "@/lib/products";

interface SwipeableProductImageProps {
  product: Product;
}

export function SwipeableProductImage({
  product,
}: SwipeableProductImageProps) {
  const t = useTranslations("bestSellers");

  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const images = useMemo(() => {
    const validImages = [product.image, ...(product.images || [])]
      .map((image) => image?.trim())
      .filter((image): image is string => Boolean(image));

    return [...new Set(validImages)];
  }, [product.images, product.image]);

  const hasMultipleImages = images.length > 1;
  const primaryImage = images[0] || product.image;
  // Keep the preview image lightweight.
  const hoverImage = images.find((image) => image !== primaryImage);
  const hasHoverImage = Boolean(hoverImage);

  const handleSlideChange = useCallback((newIndex: number) => {
    setCurrentIndex(newIndex);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : e.clientX;

      setStartX(clientX);
      setIsDragging(true);
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();
    },
    [isDragging]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDragging) return;

      setIsDragging(false);

      const clientX =
        "changedTouches" in e
          ? e.changedTouches[0].clientX
          : e.clientX;

      const diff = startX - clientX;
      const threshold = 50;

      if (Math.abs(diff) > threshold) {
        if (diff > 0 && currentIndex < images.length - 1) {
          handleSlideChange(currentIndex + 1);
        } else if (diff < 0 && currentIndex > 0) {
          handleSlideChange(currentIndex - 1);
        }
      }
    },
    [isDragging, startX, currentIndex, images.length, handleSlideChange]
  );

  const goToSlide = (index: number) => {
    handleSlideChange(index);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-3 border border-[#0F1A26]/5 md:transition-all md:duration-300 md:group-hover:border-[#EEBC3F]/50 md:group-hover:shadow-xl md:group-hover:shadow-[#EEBC3F]/10 bg-[#F1EBE3]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* MOBILE */}
      <div
        className="md:hidden flex h-full transition-transform duration-300 ease-out"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
        }}
      >
        {images.map((img, idx) => (
          <div
            key={idx}
            className="min-w-full h-full flex-shrink-0 relative"
          >
            <Image
              src={img}
              alt={`${product.name} - view ${idx + 1}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-contain pointer-events-none"
              draggable={false}
              quality={60}
              loading={idx === 0 ? "eager" : "lazy"}
              priority={idx === 0}
            />
          </div>
        ))}
      </div>

      {/* DESKTOP DEFAULT */}
      <div
        className={`hidden md:block absolute inset-0 z-10 transition-opacity duration-500 ${
          hasHoverImage ? "group-hover:opacity-0" : "opacity-100"
        }`}
      >
        <Image
          src={primaryImage}
          alt={product.name}
          fill
          sizes="(max-width: 1024px) 33vw, 25vw"
          className="object-contain pointer-events-none"
          quality={65}
          loading="lazy"
        />
      </div>

      {/* DESKTOP HOVER */}
      {hoverImage && (
        <div className="hidden md:block absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Image
            src={hoverImage}
            alt={`${product.name} - hover view`}
            fill
            sizes="(max-width: 1024px) 33vw, 25vw"
            className="object-contain pointer-events-none"
            quality={60}
            loading="lazy"
          />
        </div>
      )}

      {/* TAG */}
      {product.tag && (
        <span
          className={`absolute top-2 left-2 sm:top-3 sm:left-3 text-[10px] font-semibold tracking-wider uppercase px-2 py-1 rounded-full z-30 ${
            product.tag === "Best Seller"
              ? "bg-[#EEBC3F] text-[#0F1A26]"
              : product.tag === "New"
              ? "bg-[#0F1A26] text-white"
              : product.tag === "RFID"
              ? "bg-[#4B1F1F] text-[#F1EBE3]"
              : "bg-white/90 text-[#0F1A26]"
          }`}
        >
          {product.tag === "Best Seller"
            ? t("bestSeller")
            : product.tag === "Best Value"
            ? t("bestValue")
            : product.tag === "Popular"
            ? t("popular")
            : product.tag === "Bundle"
            ? t("bundle")
            : product.tag === "Essential"
            ? t("essential")
            : product.tag === "New"
            ? t("new")
            : product.tag === "Limited"
            ? t("limited")
            : product.tag}
        </span>
      )}

      {/* DISCOUNT */}
      {!product.dynamicPricing &&
        product.originalPrice > 0 &&
        product.price > 0 && (
          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-[#EEBC3F] text-[#1e3a5f] text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full z-30 shadow-lg">
            -
            {Math.round(
              (1 - product.price / product.originalPrice) * 100
            )}
            %
          </span>
        )}

      {/* MOBILE DOTS */}
      {hasMultipleImages && (
        <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30 bg-black/40 px-3 py-2 rounded-full backdrop-blur-sm">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentIndex === idx
                  ? "w-5 bg-[#EEBC3F]"
                  : "w-2 bg-white/80 hover:bg-white"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* DESKTOP OVERLAY */}
      <div className="hidden md:flex absolute inset-0 z-40 bg-[#0F1A26]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center pointer-events-none">
        <span className="text-white font-semibold text-sm tracking-wider uppercase">
          {t("viewProduct")}
        </span>
      </div>
    </div>
  );
}
