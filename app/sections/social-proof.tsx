"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Star,
  ArrowRight,
  Images,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselApi,
} from "@/components/ui/carousel";
import {
  ReviewsLightbox,
  type ReviewImage,
} from "@/app/components/reviews-lightbox";

export function SocialProof() {
  const t = useTranslations("socialProof");

  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [reviewImages, setReviewImages] = useState<ReviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

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
    if (!api) return;

    const carouselApi = api;

    function onSelect() {
      setCurrent(carouselApi.selectedScrollSnap());
    }

    onSelect();
    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [api]);

  function openLightbox(index: number) {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  }

  const hasReviews = reviewImages.length > 0;

  return (
    <>
      <section className="py-20 bg-[#F1EBE3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Heading */}
          <div className="text-center mb-12">
            <span className="text-[#EEBC3F] text-sm font-semibold uppercase tracking-wider">
              {t("sectionLabel") || "Customer Reviews"}
            </span>

            <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 mb-4">
              {t("title") || "Loved by Customers"}
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
                {t("rating") || "Real customer feedback"}
              </span>
            </div>
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="aspect-[9/16] rounded-2xl bg-white/70 border border-[#0F1A26]/5 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* Reviews Carousel */}
          {!isLoading && hasReviews && (
            <div className="relative">
              {/* Desktop Carousel Arrows */}
              {reviewImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => api?.scrollPrev()}
                    className="absolute -left-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F1A26] shadow-lg border border-[#0F1A26]/10 transition hover:bg-[#EEBC3F] lg:flex"
                    aria-label="Previous reviews"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => api?.scrollNext()}
                    className="absolute -right-4 top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#0F1A26] shadow-lg border border-[#0F1A26]/10 transition hover:bg-[#EEBC3F] lg:flex"
                    aria-label="Next reviews"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}

              <Carousel
                setApi={setApi}
                opts={{
                  align: "start",
                  loop: reviewImages.length > 4,
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent className="-ml-4">
                  {reviewImages.map((review, index) => (
                    <CarouselItem
                      key={review.src}
                      className="pl-4 basis-[78%] sm:basis-1/2 lg:basis-1/4"
                    >
                      <button
                        type="button"
                        onClick={() => openLightbox(index)}
                        className="group block w-full text-left bg-white rounded-2xl p-3 border border-[#0F1A26]/10 h-full shadow-sm hover:shadow-lg transition-all duration-300 cursor-zoom-in"
                        aria-label={`Open review image ${index + 1}`}
                      >
                        <div className="relative aspect-[9/16] rounded-xl overflow-hidden bg-[#F8F6F3]">
                          <Image
                            src={review.src}
                            alt={review.alt}
                            fill
                            sizes="(max-width: 640px) 78vw, (max-width: 1024px) 50vw, 25vw"
                            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
                            priority={index < 2}
                          />

                          <div className="absolute inset-0 bg-[#0F1A26]/0 transition group-hover:bg-[#0F1A26]/5" />

                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#0F1A26] opacity-0 shadow-sm transition group-hover:opacity-100">
                            Click to enlarge
                          </div>
                        </div>
                      </button>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>

              {/* Mobile Swipe Dots Indicator */}
              <div className="flex md:hidden items-center justify-center gap-1.5 mt-4">
                {reviewImages
                  .slice(0, Math.min(reviewImages.length, 8))
                  .map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
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

              <p className="mt-4 text-center text-xs text-[#0F1A26]/45 md:hidden">
                Swipe to browse reviews
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !hasReviews && (
            <div className="bg-white rounded-2xl p-8 border border-[#0F1A26]/10 text-center max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-full bg-[#EEBC3F]/15 flex items-center justify-center mx-auto mb-4">
                <Images className="w-7 h-7 text-[#EEBC3F]" />
              </div>

              <h3 className="text-xl font-bold text-[#0F1A26] mb-2">
                No review images found
              </h3>

              <p className="text-sm text-[#0F1A26]/60">
                Add your screenshots inside{" "}
                <span className="font-semibold text-[#0F1A26]">
                  public/reviews
                </span>{" "}
                and they will appear automatically.
              </p>
            </div>
          )}

          {/* View All Button */}
          <div className="mt-10 text-center">
            <Link
              href="/reviews"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#0F1A26] text-white rounded-full font-semibold hover:bg-[#EEBC3F] hover:text-[#0F1A26] transition-colors group"
            >
              {t("viewAllReviews") || "View All Reviews"}
              <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Platform badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-8">
            <p className="text-[#0F1A26]/50 text-sm w-full text-center mb-4">
              {t("marketplaces") || "Also rated on marketplaces"}
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

      <ReviewsLightbox
        images={reviewImages}
        open={lightboxOpen}
        initialIndex={selectedImageIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}