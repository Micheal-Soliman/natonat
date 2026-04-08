"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { products } from "@/lib/products";

// Filter best seller products from lib/products
const bestSellers = products.filter(p => p.tag === "Best Seller" || p.tag === "New").slice(0, 6);

export function BestSellers() {
  const t = useTranslations('bestSellers');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

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

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

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
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="w-full overflow-visible"
        >
          <CarouselContent className="-ml-3 sm:-ml-5">
            {bestSellers.map((product, index) => (
              <CarouselItem
                key={product.id}
                className="pl-3 sm:pl-5 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 flex-shrink-0"
              >
                <Link
                  href={`/product/${product.slug}`}
                  className="group cursor-pointer block select-none"
                  draggable={false}
                >
                  {/* Product Image */}
                  <div className="relative aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 border border-white/10 bg-[#F1EBE3]">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="absolute inset-0 w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 pointer-events-none"
                      loading="lazy"
                      draggable={false}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1A26]/10 to-transparent" />

                    {product.tag && (
                      <span className={`absolute top-2 left-2 sm:top-4 sm:left-4 z-10 text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${product.tag === 'Best Seller' ? 'bg-[#EEBC3F] text-[#0F1A26]' :
                          product.tag === 'New' ? 'bg-white text-[#0F1A26]' :
                            product.tag === 'Limited' ? 'bg-[#4B1F1F] text-[#F1EBE3]' :
                              'bg-[#EEBC3F]/20 text-[#EEBC3F] border border-[#EEBC3F]/30'
                        }`}>
                        {product.tag === 'Best Seller' ? t('bestSeller') :
                          product.tag === 'New' ? t('new') :
                            product.tag === 'Limited' ? t('limited') : product.tag}
                      </span>
                    )}

                    {/* Hover overlay - View Product */}
                    <div className="absolute inset-0 bg-[#0F1A26]/20 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                      <span className="text-[#0F1A26] font-semibold text-xs sm:text-sm tracking-wider uppercase bg-white/90 px-4 py-2 rounded-full">
                        {t('viewProduct')}
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                      <span className="text-[#EEBC3F]/80 text-[9px] sm:text-[10px] font-semibold tracking-[0.15em] uppercase">
                        {product.type}
                      </span>
                      {/* {product.size && (
                        <>
                          <span className="text-white/20">·</span>
                          <span className="text-white/40 text-[9px] sm:text-[10px]">{t('size')} {product.size}</span>
                        </>
                      )} */}
                    </div>
                    <h3 className="text-white font-medium text-sm sm:text-lg mb-1 sm:mb-2 tracking-tight group-hover:text-[#EEBC3F] transition-colors duration-300 line-clamp-1">
                      {product.name}
                    </h3>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>

          {/* Custom navigation */}
          <div className="hidden md:flex items-center gap-3 mt-8">
            <CarouselPrevious className="static translate-y-0 w-12 h-12 rounded-full bg-white/5 border-white/10 text-white hover:bg-white hover:text-[#0F1A26] transition-all duration-300" />
            <CarouselNext className="static translate-y-0 w-12 h-12 rounded-full bg-white/5 border-white/10 text-white hover:bg-white hover:text-[#0F1A26] transition-all duration-300" />
          </div>
        </Carousel>

        {/* Mobile Swipe Dots Indicator */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-4">
          {bestSellers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${current === idx
                  ? "w-4 bg-[#EEBC3F]"
                  : "w-1.5 bg-white/30"
                }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
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
    </section>
  );
}
