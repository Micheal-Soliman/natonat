"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Star, ArrowLeft, Images } from "lucide-react";
import Link from "next/link";
import {
  ReviewsLightbox,
  type ReviewImage,
} from "@/app/components/reviews-lightbox";

export default function ReviewsPage() {
  const t = useTranslations("socialProof");

  const [isVisible, setIsVisible] = useState(false);
  const [reviewImages, setReviewImages] = useState<ReviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadReviewImages() {
      try {
        const res = await fetch("/api/reviews", {
          cache: "no-store",
        });

        const data = await res.json();
        setReviewImages(Array.isArray(data.images) ? data.images : []);
      } catch (error) {
        console.error("Failed to load review images:", error);
        setReviewImages([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewImages();
  }, []);

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

  function openLightbox(index: number) {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  }

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
              <span className="text-sm font-medium">
                {t("backToHome") || "Back to Home"}
              </span>
            </Link>

            <div className="text-center">
              <span className="text-[#EEBC3F] text-xs font-semibold tracking-[0.3em] uppercase mb-4 md:mb-6 block">
                {t("sectionLabel") || "Customer Reviews"}
              </span>

              <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 md:mb-8 tracking-tight">
                {t("title") || "Loved by Customers"}
              </h1>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-5 h-5 md:w-6 md:h-6 fill-[#EEBC3F] text-[#EEBC3F]"
                    />
                  ))}
                </div>

                <span className="text-white/80 text-base md:text-lg font-medium">
                  {t("rating") || "Real customer feedback"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Images Grid */}
        <div
          ref={ref}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20"
        >
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {[...Array(8)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[9/16] rounded-2xl md:rounded-3xl bg-white/70 border border-[#0F1A26]/5 animate-pulse"
                />
              ))}
            </div>
          ) : reviewImages.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
              {reviewImages.map((review, index) => (
                <button
                  key={review.src}
                  type="button"
                  onClick={() => openLightbox(index)}
                  className={`group text-left bg-white rounded-2xl md:rounded-3xl p-3 border border-[#0F1A26]/10 shadow-lg hover:shadow-xl transition-all duration-500 cursor-zoom-in ${isVisible
                      ? "opacity-100 translate-y-0"
                      : "opacity-0 translate-y-8"
                    }`}
                  style={{ transitionDelay: `${Math.min(index * 60, 600)}ms` }}
                  aria-label={`Open review image ${index + 1}`}
                >
                  <div className="relative aspect-[9/16] overflow-hidden rounded-xl md:rounded-2xl bg-[#F8F6F3]">
                    <Image
                      src={review.src}
                      alt={review.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                      loading="lazy"
                      quality={55}
                    />

                    <div className="absolute inset-0 bg-[#0F1A26]/0 transition group-hover:bg-[#0F1A26]/5" />

                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0F1A26] opacity-0 shadow-sm transition group-hover:opacity-100">
                      Click to enlarge
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-8 md:p-12 border border-[#0F1A26]/10 shadow-lg text-center max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-[#EEBC3F]/15 flex items-center justify-center mx-auto mb-5">
                <Images className="w-8 h-8 text-[#EEBC3F]" />
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-[#0F1A26] mb-3">
                No review images found
              </h2>

              <p className="text-[#0F1A26]/60 leading-relaxed">
                Add your review screenshots inside{" "}
                <span className="font-semibold text-[#0F1A26]">
                  public/reviews
                </span>{" "}
                and they will appear here automatically.
              </p>
            </div>
          )}

          {/* Platform Ratings */}
          <div className="mt-12 md:mt-20 text-center">
            <p className="text-[#0F1A26]/50 text-base md:text-lg mb-6 md:mb-8">
              {t("marketplaces") || "Also rated on marketplaces"}
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6">
              <div className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white rounded-2xl border border-[#0F1A26]/10 shadow-lg">
                <span className="font-bold text-[#0F1A26] text-lg md:text-xl">
                  amazon
                </span>
                <span className="text-[#0F1A26]/60 text-base md:text-lg">
                  4.5★
                </span>
              </div>

              <div className="flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 bg-white rounded-2xl border border-[#0F1A26]/10 shadow-lg">
                <span className="font-bold text-[#0F1A26] text-lg md:text-xl">
                  noon
                </span>
                <span className="text-[#0F1A26]/60 text-base md:text-lg">
                  4.4★
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 md:mt-20 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#EEBC3F] text-[#0F1A26] rounded-full font-bold hover:bg-[#0F1A26] hover:text-white transition-colors"
            >
              {t("shopNow") || "Shop Now"}
            </Link>
          </div>
        </div>
      </main>

      <Footer />

      <ReviewsLightbox
        images={reviewImages}
        open={lightboxOpen}
        initialIndex={selectedImageIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}