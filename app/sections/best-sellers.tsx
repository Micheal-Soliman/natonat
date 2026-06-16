"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link, useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from 'next-intl';
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Zap } from "lucide-react";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useCart } from "@/app/lib/cart-context";
import { sizes } from "@/lib/products";
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
  const tq = useTranslations('shop');
  const router = useRouter();
  const products = useCatalogProducts();
  const { addToCart, setBuyNowItem } = useCart();
  const displayProducts = getDisplayProducts(products);
  const locale = useLocale();
  const isRTL = locale === 'ar';
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [quickSelections, setQuickSelections] = useState<Record<number, { size?: string; color?: string }>>({});
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

  const getQuickSizeOptions = (product: Product) => {
    if (product.sizePrices) {
      return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
    }

    if (!product.size) return [];

    const selectedSize = product.size.toLowerCase();
    return sizes.filter((size) => size.id === selectedSize);
  };

  const getQuickSelection = (product: Product) => {
    const sizeOptions = getQuickSizeOptions(product);
    const colorOptions = product.colors || [];
    const savedSelection = quickSelections[product.id] || {};

    return {
      size: savedSelection.size || sizeOptions[0]?.id || product.size?.toLowerCase(),
      color: savedSelection.color || colorOptions[0]?.id || product.color,
    };
  };

  const updateQuickSelection = (productId: number, selection: { size?: string; color?: string }) => {
    setQuickSelections((current) => ({
      ...current,
      [productId]: {
        ...current[productId],
        ...selection,
      },
    }));
  };

  const isBundleProduct = (product: Product) => hasCategory(product, "bundles");

  const getQuickCartItem = (product: Product) => {
    const selection = getQuickSelection(product);
    const sizeKey = selection.size?.toLowerCase() as keyof NonNullable<Product["sizePrices"]>;
    const sizePrice = sizeKey && product.sizePrices?.[sizeKey];
    const colorVariant = product.colors?.find((color) => color.id === selection.color);

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      type: product.type,
      price: sizePrice?.price ?? product.price,
      originalPrice: sizePrice?.originalPrice ?? product.originalPrice,
      image: colorVariant?.image || product.image,
      size: product.sizePrices || product.size ? selection.size : undefined,
      color: colorVariant?.name || selection.color || product.color,
      quantity: 1,
    };
  };

  const getColorSwatchStyle = (colorName?: string) => {
    const normalizedColor = colorName?.toLowerCase() || "";
    const colorMap: Record<string, string> = {
      black: "#111827",
      white: "#F8FAFC",
      grey: "#9CA3AF",
      gray: "#9CA3AF",
      blue: "#2563EB",
      navy: "#1E3A8A",
      red: "#DC2626",
      green: "#16A34A",
      yellow: "#FACC15",
      gold: "#D6A62C",
      purple: "#7C3AED",
      orange: "#F97316",
      brown: "#8B5E3C",
      cognac: "#9A5A2E",
    };

    const matches = Object.entries(colorMap)
      .filter(([name]) => normalizedColor.includes(name))
      .map(([, value]) => value);

    if (matches.length >= 2) {
      return { background: `linear-gradient(135deg, ${matches[0]} 0 50%, ${matches[1]} 50% 100%)` };
    }

    if (matches.length === 1) {
      return { backgroundColor: matches[0] };
    }

    return { background: "linear-gradient(135deg, #EEBC3F, #0F1A26)" };
  };

  const handleQuickAdd = (product: Product) => {
    if (isBundleProduct(product)) {
      router.push(`/product/${product.slug}`);
      return;
    }

    addToCart(getQuickCartItem(product));
  };

  const handleQuickBuy = (product: Product) => {
    if (isBundleProduct(product)) {
      router.push(`/product/${product.slug}`);
      return;
    }

    setBuyNowItem(getQuickCartItem(product));
    router.push("/checkout");
  };

  const stopCarouselDrag = (event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    isDraggingRef.current = false;
    setIsDragging(false);
    hasDraggedRef.current = false;
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
            {displayProducts.map((product, index) => {
              const sizeOptions = getQuickSizeOptions(product);
              const colorOptions = product.colors || [];
              const selection = getQuickSelection(product);
              const isBundle = isBundleProduct(product);

              return (
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

                  <div
                    className="mt-3 rounded-2xl border border-white/10 bg-white/[0.07] p-2.5 shadow-lg shadow-black/10 backdrop-blur-sm"
                    onMouseDown={stopCarouselDrag}
                    onMouseMove={(event) => event.stopPropagation()}
                    onTouchStart={stopCarouselDrag}
                    onTouchMove={(event) => event.stopPropagation()}
                  >
                    {!isBundle && (sizeOptions.length > 1 || colorOptions.length > 1) && (
                      <div className="mb-2 space-y-2">
                        {sizeOptions.length > 1 && (
                          <div>
                            <div className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
                              {t('size')}
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {sizeOptions.map((size) => {
                                const isSelected = selection.size === size.id;

                                return (
                                  <button
                                    key={size.id}
                                    type="button"
                                    aria-pressed={isSelected}
                                    onClick={() => updateQuickSelection(product.id, { size: size.id })}
                                    className={`h-8 rounded-lg border text-xs font-bold transition-all ${
                                      isSelected
                                        ? "border-[#EEBC3F] bg-[#EEBC3F] text-[#0F1A26] shadow-sm"
                                        : "border-white/10 bg-white/10 text-white/70 hover:border-[#EEBC3F]/60 hover:text-white"
                                    }`}
                                  >
                                    {size.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {colorOptions.length > 1 && (
                          <div>
                            <div className="mb-1.5 flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-white/45">
                                {tq('quickAdd.color')}
                              </span>
                              <span className="truncate text-[11px] font-semibold text-white/60">
                                {colorOptions.find((color) => color.id === selection.color)?.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {colorOptions.map((color) => {
                                const isSelected = selection.color === color.id;

                                return (
                                  <button
                                    key={color.id}
                                    type="button"
                                    aria-label={`${tq('quickAdd.color')}: ${color.name}`}
                                    aria-pressed={isSelected}
                                    onClick={() => updateQuickSelection(product.id, { color: color.id })}
                                    className={`h-7 w-7 rounded-full border p-0.5 transition-all ${
                                      isSelected
                                        ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/35"
                                        : "border-white/20 hover:border-[#EEBC3F]/70"
                                    }`}
                                  >
                                    <span
                                      className="block h-full w-full rounded-full border border-black/10"
                                      style={getColorSwatchStyle(color.name)}
                                    />
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        aria-label={isBundle ? tq('quickAdd.customize') : tq('quickAdd.add')}
                        onClick={() => handleQuickAdd(product)}
                        className="h-9 rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white hover:text-[#0F1A26] px-2 text-xs font-bold"
                        variant="outline"
                      >
                        <ShoppingCart className="w-3.5 h-3.5 shrink-0 sm:mr-1" />
                        <span className="truncate">{isBundle ? tq('quickAdd.customize') : tq('quickAdd.add')}</span>
                      </Button>
                      <Button
                        type="button"
                        aria-label={isBundle ? tq('quickAdd.customize') : tq('quickAdd.buy')}
                        onClick={() => handleQuickBuy(product)}
                        className="h-9 rounded-xl bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#d4a535] px-2 text-xs font-bold shadow-sm shadow-[#EEBC3F]/25"
                      >
                        <Zap className="w-3.5 h-3.5 shrink-0 sm:mr-1" />
                        <span className="truncate">{isBundle ? tq('quickAdd.customize') : tq('quickAdd.buy')}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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
