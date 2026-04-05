"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Star, Quote, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";

export function SocialProof() {
  const t = useTranslations('socialProof');
  const tr = useTranslations('socialProof.reviews');
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const reviews = [
    {
      id: 1,
      name: tr('1.name'),
      location: tr('1.location'),
      rating: 5,
      text: tr('1.text'),
      product: tr('1.product'),
    },
    {
      id: 2,
      name: tr('2.name'),
      location: tr('2.location'),
      rating: 5,
      text: tr('2.text'),
      product: tr('2.product'),
    },
    {
      id: 3,
      name: tr('3.name'),
      location: tr('3.location'),
      rating: 5,
      text: tr('3.text'),
      product: tr('3.product'),
    },
    {
      id: 4,
      name: tr('4.name'),
      location: tr('4.location'),
      rating: 4,
      text: tr('4.text'),
      product: tr('4.product'),
    },
  ];
  return (
    <section className="py-20 bg-[#F1EBE3]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
            {t('sectionLabel')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 mb-4">
            {t('title')}
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className="w-5 h-5 fill-[#EEBC3F] text-[#EEBC3F]"
                />
              ))}
            </div>
            <span className="text-[#0F1A26]/60 text-sm">
              {t('rating')}
            </span>
          </div>
        </div>

        {/* Reviews Carousel */}
        <Carousel
          setApi={setApi}
          opts={{
            align: "start",
            loop: true,
            dragFree: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {reviews.map((review) => (
              <CarouselItem
                key={review.id}
                className="pl-4 basis-full sm:basis-1/2 lg:basis-1/4"
              >
                <div className="bg-white rounded-xl p-6 border border-[#0F1A26]/10 h-full">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-[#EEBC3F] text-[#EEBC3F]"
                      />
                    ))}
                  </div>

                  <div className="relative mb-4">
                    <Quote className="absolute -top-2 -left-2 w-6 h-6 text-[#EEBC3F]/30" />
                    <p className="text-[#0F1A26]/80 text-sm leading-relaxed relative z-10">
                      &ldquo;{review.text}&rdquo;
                    </p>
                  </div>

                  <div className="border-t border-[#0F1A26]/10 pt-4 mt-4">
                    <p className="text-[#0F1A26] font-medium text-sm">{review.name}</p>
                    <p className="text-[#0F1A26]/50 text-xs">{review.location}</p>
                    <p className="text-[#EEBC3F] text-xs mt-1">{review.product}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Mobile Swipe Dots Indicator */}
        <div className="flex md:hidden items-center justify-center gap-1.5 mt-4">
          {reviews.map((_, idx) => (
            <button
              key={idx}
              onClick={() => api?.scrollTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                current === idx 
                  ? "w-4 bg-[#EEBC3F]" 
                  : "w-1.5 bg-[#0F1A26]/20"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
        
        <div className="mt-10 text-center">
          <Link
            href="/reviews"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1A26] text-white rounded-full font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors group"
          >
            {t('viewAllReviews')}
            <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Platform badges */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
          <p className="text-[#0F1A26]/50 text-sm w-full text-center mb-4">
            {t('marketplaces')}
          </p>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-[#0F1A26]/10">
            <span className="font-bold text-[#0F1A26]">amazon</span>
            <span className="text-[#0F1A26]/60 text-sm">4.5★</span>
          </div>
          <div className="flex items-center gap-2 px-6 py-3 bg-white rounded-lg border border-[#0F1A26]/10">
            <span className="font-bold text-[#0F1A26]">noon</span>
            <span className="text-[#0F1A26]/60 text-sm">4.4★</span>
          </div>
        </div>
      </div>
    </section>
  );
}
