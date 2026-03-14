"use client";

import { useState, useRef, useCallback } from "react";
import { ShoppingBag } from "lucide-react";
import type { Product } from "@/lib/products";

interface SwipeableProductImageProps {
  product: Product;
  onAddToCart: (e: React.MouseEvent, product: Product) => void;
}

export function SwipeableProductImage({ product, onAddToCart }: SwipeableProductImageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const images = product.images || [product.image];
  const hasMultipleImages = images.length > 1;

  const handleTouchStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    setStartX(clientX);
    setIsDragging(true);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
  }, [isDragging]);

  const handleTouchEnd = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    setIsDragging(false);

    const clientX = 'changedTouches' in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX - clientX;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0 && currentIndex < images.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else if (diff < 0 && currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
      }
    }
  }, [isDragging, startX, currentIndex, images.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <div 
      ref={containerRef}
      className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 border border-[#0F1A26]/5 md:transition-all md:duration-300 md:group-hover:border-[#EEBC3F]/50 md:group-hover:shadow-xl md:group-hover:shadow-[#EEBC3F]/10"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
    >
      {/* Images Carousel */}
      <div 
        className="flex h-full transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((img, idx) => (
          <img 
            key={idx}
            src={img} 
            alt={`${product.name} - view ${idx + 1}`}
            className="min-w-full h-full object-cover flex-shrink-0 pointer-events-none"
            draggable={false}
          />
        ))}
      </div>

      {/* Desktop Hover Image */}
      {hasMultipleImages && (
        <>
          <img 
            src={product.image} 
            alt={product.name}
            className="hidden md:block absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
          />
          <img 
            src={images[1] || product.image} 
            alt={`${product.name} - view 2`}
            className="hidden md:block absolute inset-0 w-full h-full object-cover transition-opacity duration-500 opacity-0 group-hover:opacity-100"
          />
        </>
      )}

      {/* Tag */}
      {product.tag && (
        <span className={`absolute top-3 left-3 text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-full z-10 ${
          product.tag === 'Best Seller' ? 'bg-[#EEBC3F] text-[#0F1A26]' :
          product.tag === 'New' ? 'bg-[#0F1A26] text-white' :
          product.tag === 'RFID' ? 'bg-[#4B1F1F] text-[#F1EBE3]' :
          'bg-white/90 text-[#0F1A26]'
        }`}>
          {product.tag}
        </span>
      )}
      
      {/* Discount Badge */}
      <span className="absolute top-3 right-3 bg-[#EEBC3F] text-[#1e3a5f] text-sm font-bold px-3 py-1.5 rounded-full z-10 shadow-lg">
        -{Math.round((1 - product.price / product.originalPrice) * 100)}%
      </span>

      {/* Mobile Dots Indicator */}
      {hasMultipleImages && (
        <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goToSlide(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                currentIndex === idx 
                  ? "w-4 bg-[#EEBC3F]" 
                  : "w-1.5 bg-white/70 hover:bg-white"
              }`}
              aria-label={`Go to image ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Desktop Hover overlay */}
      <div className="hidden md:flex absolute inset-0 bg-[#0F1A26]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 items-center justify-center">
        <button 
          className="w-12 h-12 bg-[#EEBC3F] rounded-full flex items-center justify-center transform scale-75 group-hover:scale-100 transition-all duration-300 shadow-lg hover:shadow-[#EEBC3F]/50"
          onClick={(e) => onAddToCart(e, product)}
        >
          <ShoppingBag className="w-5 h-5 text-[#0F1A26]" />
        </button>
      </div>
    </div>
  );
}
