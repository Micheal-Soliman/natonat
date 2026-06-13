"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import type { Product } from "@/lib/products";

// Get products from all 3 categories for display
const hasCategory = (product: Product, category: string) =>
  Array.isArray(product.category)
    ? product.category.includes(category)
    : product.category === category;

const getDisplayProducts = (products: Product[]) => {
  const tagged = products.filter(p => p.tag === "Best Seller" || p.tag === "New").slice(0, 4);
  const luggage = products.find(p => hasCategory(p, "luggage-covers") && !tagged.find(t => t.id === p.id));
  const passport = products.find(p => hasCategory(p, "passport-wallets") && !tagged.find(t => t.id === p.id));
  const packonat = products.find(p => hasCategory(p, "packonat") && !tagged.find(t => t.id === p.id));

  const result = [...tagged];
  if (luggage) result.push(luggage);
  if (passport) result.push(passport);
  if (packonat) result.push(packonat);

  const remaining = products.filter(p => !result.find(r => r.id === p.id)).slice(0, 8 - result.length);
  return [...result, ...remaining].slice(0, 8);
};

export function BestSellers() {
  const t = useTranslations('bestSellers');
  const products = useCatalogProducts();
  const displayProducts = getDisplayProducts(products);
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const hasDraggedRef = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScrollLeft = useRef(0);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDraggingRef.current = true;
    setIsDragging(true);
    hasDraggedRef.current = false;
    dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
    dragStartScrollLeft.current = scrollRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - dragStartX.current;

    // Only consider it a drag if moved more than 5px
    if (Math.abs(walk) > 5) {
      hasDraggedRef.current = true;
    }

    scrollRef.current.scrollLeft = dragStartScrollLeft.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    // Reset hasDragged after a short delay to prevent click
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 10);
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setIsDragging(false);
    hasDraggedRef.current = false;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (isRTL) {
        // In RTL, scrollLeft is negative or starts from max
        setCanScrollLeft(scrollLeft < -5 || Math.abs(scrollLeft) < maxScroll - 5);
        setCanScrollRight(scrollLeft > -maxScroll + 5);
      } else {
        setCanScrollLeft(scrollLeft > 5);
        setCanScrollRight(scrollLeft < maxScroll - 5);
      }
    }
  }, [isRTL]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      const frameId = requestAnimationFrame(checkScroll);
      return () => {
        cancelAnimationFrame(frameId);
        el.removeEventListener('scroll', checkScroll);
      };
    }
  }, [checkScroll]);

  const scroll = (direction: 'prev' | 'next') => {
    if (scrollRef.current) {
      const cardWidth = scrollRef.current.firstElementChild?.clientWidth || 280;
      const gap = 20;
      const scrollAmount = cardWidth + gap;

      // For RTL: prev goes right (+), next goes left (-)
      // For LTR: prev goes left (-), next goes right (+)
      const amount = isRTL
        ? (direction === 'prev' ? scrollAmount : -scrollAmount)
        : (direction === 'prev' ? -scrollAmount : scrollAmount);

      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section ref={ref} className="py-24 bg-[#0F1A26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex items-end justify-between mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div>
            <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.2em] uppercase">{t('sectionLabel')}</span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-white mt-3 tracking-tight">
              {t('title')}
            </h2>
            <p className="text-white/50 mt-2 font-light">
              {t('subtitle')}
            </p>
          </div>
          <Button
            variant="outline"
            className="hidden md:flex border-white/20 text-white hover:bg-white hover:text-[#0F1A26] rounded-full px-6 h-11 transition-all duration-300"
          >
            {t('viewAll')}
            <ArrowRight className={`w-4 h-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Button>
        </div>

        {/* Carousel Container with drag support */}
        <div className="relative">
          <div
            ref={scrollRef}
            className={`flex gap-4 md:gap-5 overflow-x-auto pb-4 scrollbar-hide cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pinch-zoom',
              userSelect: 'none'
            }}
            dir={isRTL ? 'rtl' : 'ltr'}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {displayProducts.map((product, index) => (
              <div
                key={product.id}
                className={`group flex-shrink-0 w-[260px] sm:w-[280px] md:w-[300px] transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                  }`}
                style={{ transitionDelay: `${(index + 1) * 80}ms` }}
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="block"
                  onClick={(e) => {
                    if (hasDraggedRef.current) {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-white/10 bg-[#F1EBE3]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 65vw, (max-width: 1024px) 33vw, 300px"
                      className="object-contain transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                      quality={55}
                    />

                    {product.tag && (
                      <span className={`absolute top-2 left-2 sm:top-3 sm:left-3 z-10 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${product.tag === 'Best Seller' ? 'bg-[#EEBC3F] text-[#0F1A26]' :
                        product.tag === 'New' ? 'bg-white text-[#0F1A26]' :
                          product.tag === 'Limited' ? 'bg-[#4B1F1F] text-[#F1EBE3]' :
                            'bg-[#EEBC3F]/20 text-[#EEBC3F] border border-[#EEBC3F]/30'
                        }`}>
                        {product.tag === 'Best Seller' ? t('bestSeller') :
                          product.tag === 'Best Value' ? t('bestValue') :
                            product.tag === 'Popular' ? t('popular') :
                              product.tag === 'Bundle' ? t('bundle') :
                                product.tag === 'Essential' ? t('essential') :
                                  product.tag === 'New' ? t('new') :
                                    product.tag === 'Limited' ? t('limited') : product.tag}
                      </span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[#EEBC3F]/80 text-[10px] font-semibold tracking-[0.15em] uppercase">
                        {product.type}
                      </span>
                    </div>
                    <h3 className="text-white font-medium text-sm sm:text-base tracking-tight group-hover:text-[#EEBC3F] transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows Below */}
        <div className="hidden md:flex items-center justify-center gap-3 mt-6">
          <button
            onClick={() => scroll('prev')}
            className={`w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:bg-white hover:text-[#0F1A26] hover:border-white ${!canScrollLeft ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
            aria-label="Previous"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('next')}
            className={`w-12 h-12 rounded-full border border-white/20 text-white flex items-center justify-center transition-all duration-300 hover:bg-white hover:text-[#0F1A26] hover:border-white ${!canScrollRight ? 'opacity-30 pointer-events-none' : 'opacity-100'}`}
            aria-label="Next"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile CTA */}
        <div className="mt-8 text-center md:hidden">
          <Button
            variant="outline"
            className="border-white/20 text-white hover:bg-white hover:text-[#0F1A26] rounded-full"
          >
            {t('viewAll')}
          </Button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
