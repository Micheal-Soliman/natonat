"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Star, Quote, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const t = useTranslations('socialProof');
  const tr = useTranslations('socialProof.reviews');
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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
    {
      id: 5,
      name: tr('1.name'),
      location: tr('1.location'),
      rating: 5,
      text: tr('1.text'),
      product: tr('1.product'),
      featured: true,
    },
    {
      id: 6,
      name: tr('2.name'),
      location: tr('2.location'),
      rating: 5,
      text: tr('2.text'),
      product: tr('2.product'),
      featured: true,
    },
  ];

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3]">
        {/* Hero Section */}
        <div className="bg-[#0F1A26] pt-28 pb-16 md:pt-32 md:pb-20 lg:pt-44 lg:pb-32">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6 md:mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('backToHome') || 'Back to Home'}</span>
            </Link>
            <div className="text-center">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">
                {t('sectionLabel')}
              </span>
              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
                {t('title')}
              </h1>
              <div className="flex items-center justify-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 md:w-6 md:h-6 fill-[#EEBC3F] text-[#EEBC3F]"
                    />
                  ))}
                </div>
                <span className="text-white/80 text-base md:text-lg font-medium">
                  {t('rating')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div ref={ref} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {reviews.map((review, index) => (
              <div
                key={review.id}
                className={`bg-white rounded-2xl md:rounded-3xl p-6 md:p-8 border border-[#0F1A26]/10 shadow-lg hover:shadow-xl transition-all duration-500 ${
                  isVisible
                    ? 'opacity-100 translate-y-0'
                    : 'opacity-0 translate-y-8'
                } ${review.featured ? 'md:col-span-2 lg:col-span-1 lg:row-span-2' : ''}`}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center gap-1 mb-4 md:mb-6">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 md:w-5 md:h-5 fill-[#EEBC3F] text-[#EEBC3F]"
                    />
                  ))}
                </div>

                <div className="relative mb-4 md:mb-6">
                  <Quote className="absolute -top-2 -left-2 w-6 h-6 md:w-8 md:h-8 text-[#EEBC3F]/20" />
                  <p className="text-[#0F1A26]/80 leading-relaxed relative z-10 text-base md:text-lg">
                    &ldquo;{review.text}&rdquo;
                  </p>
                </div>

                <div className="border-t border-[#0F1A26]/10 pt-4 md:pt-6 mt-4 md:mt-6">
                  <p className="text-[#0F1A26] font-bold text-base md:text-lg">{review.name}</p>
                  <p className="text-[#0F1A26]/50 text-sm">{review.location}</p>
                  <p className="text-[#EEBC3F] text-sm mt-2 font-medium">{review.product}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Platform Ratings */}
          <div className="mt-12 md:mt-20 text-center">
            <p className="text-[#0F1A26]/50 text-base md:text-lg mb-6 md:mb-8">{t('marketplaces')}</p>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <div className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white rounded-2xl border border-[#0F1A26]/10 shadow-lg">
                <span className="font-bold text-[#0F1A26] text-lg md:text-xl">amazon</span>
                <span className="text-[#0F1A26]/60 text-base md:text-lg">4.5★</span>
              </div>
              <div className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white rounded-2xl border border-[#0F1A26]/10 shadow-lg">
                <span className="font-bold text-[#0F1A26] text-lg md:text-xl">noon</span>
                <span className="text-[#0F1A26]/60 text-base md:text-lg">4.4★</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 md:mt-20 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#EEBC3F] text-[#0F1A26] rounded-full font-bold hover:bg-[#0F1A26] hover:text-white transition-colors"
            >
              {t('shopNow') || 'Shop Now'}
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
