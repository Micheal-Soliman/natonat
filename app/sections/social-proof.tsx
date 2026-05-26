"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Images,
  Star,
} from "lucide-react";

import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import {
  ReviewsLightbox,
  type ReviewImage,
} from "@/app/components/reviews-lightbox";

const PREVIEW_DOTS_LIMIT = 8;
const STAR_COUNT = 5;

type ReviewGalleryProps = {
  images: ReviewImage[];
  onOpen: (index: number) => void;
};

function useReviewImages() {
  const [images, setImages] = useState<ReviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadReviewImages() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const data = (await res.json()) as { images?: ReviewImage[] };

        if (isMounted) {
          setImages(Array.isArray(data.images) ? data.images : []);
        }
      } catch (error) {
        console.error("Failed to load review images:", error);
        if (isMounted) setImages([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadReviewImages();

    return () => {
      isMounted = false;
    };
  }, []);

  return { images, isLoading };
}

function SectionHeading() {
  const t = useTranslations("socialProof");

  return (
    <header className="mx-auto mb-12 max-w-2xl text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-[#EEBC3F]">
        {t("sectionLabel")}
      </p>

      <h2 className="mt-2 text-3xl font-bold text-[#0F1A26] md:text-4xl">
        {t("title")}
      </h2>

      <div className="mt-4 flex items-center justify-center gap-2">
        <span className="flex" aria-hidden="true">
          {Array.from({ length: STAR_COUNT }).map((_, index) => (
            <Star
              key={index}
              className="h-5 w-5 fill-[#EEBC3F] text-[#EEBC3F]"
            />
          ))}
        </span>

        <span className="text-sm text-[#0F1A26]/60">{t("rating")}</span>
      </div>
    </header>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="aspect-[9/16] animate-pulse rounded-xl border border-[#0F1A26]/5 bg-white/70"
        />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-[#0F1A26]/10 bg-white p-8 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#EEBC3F]/15">
        <Images className="h-7 w-7 text-[#EEBC3F]" />
      </div>

      <h3 className="mb-2 text-xl font-bold text-[#0F1A26]">
        No review images found
      </h3>

      <p className="text-sm text-[#0F1A26]/60">
        Add screenshots inside{" "}
        <span className="font-semibold text-[#0F1A26]">public/reviews</span>{" "}
        and they will appear automatically.
      </p>
    </div>
  );
}

function CarouselArrow({
  direction,
  onClick,
}: {
  direction: "previous" | "next";
  onClick: () => void;
}) {
  const isPrevious = direction === "previous";
  const Icon = isPrevious ? ChevronLeft : ChevronRight;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-[#0F1A26]/10 bg-white text-[#0F1A26] shadow-lg transition hover:bg-[#EEBC3F] lg:flex ${
        isPrevious ? "-left-4" : "-right-4"
      }`}
      aria-label={isPrevious ? "Previous reviews" : "Next reviews"}
    >
      <Icon className="h-5 w-5" />
    </button>
  );
}

function ReviewCard({
  review,
  index,
  onOpen,
}: {
  review: ReviewImage;
  index: number;
  onOpen: (index: number) => void;
}) {
  return (
    <CarouselItem
      className="basis-[78%] sm:basis-1/2 lg:basis-1/4"
    >
      <button
        type="button"
        onClick={() => onOpen(index)}
        className="group block h-full w-full cursor-zoom-in rounded-xl border border-[#0F1A26]/10 bg-white p-3 text-left shadow-sm transition-all duration-300 hover:shadow-lg"
        aria-label={`Open review image ${index + 1}`}
      >
        <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-[#F8F6F3]">
          <Image
            src={review.src}
            alt={review.alt}
            fill
            sizes="(max-width: 640px) 65vw, (max-width: 1024px) 33vw, 22vw"
            className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.02]"
            loading="lazy"
            quality={50}
          />

          <div className="absolute inset-0 bg-[#0F1A26]/0 transition group-hover:bg-[#0F1A26]/5" />
        </div>
      </button>
    </CarouselItem>
  );
}

function CarouselDots({
  count,
  current,
  onSelect,
}: {
  count: number;
  current: number;
  onSelect: (index: number) => void;
}) {
  const visibleDots = Math.min(count, PREVIEW_DOTS_LIMIT);

  return (
    <div className="mt-4 flex items-center justify-center gap-1.5 md:hidden">
      {Array.from({ length: visibleDots }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelect(index)}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            current === index ? "w-4 bg-[#EEBC3F]" : "w-1.5 bg-[#0F1A26]/20"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

function ReviewGallery({ images, onOpen }: ReviewGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) return;

    const carouselApi = api;

    function handleSelect() {
      setCurrent(carouselApi.selectedScrollSnap());
    }

    handleSelect();
    carouselApi.on("select", handleSelect);

    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [api]);

  return (
    <div className="relative" dir="ltr">
      {images.length > 1 && (
        <>
          <CarouselArrow
            direction="previous"
            onClick={() => api?.scrollPrev()}
          />
          <CarouselArrow direction="next" onClick={() => api?.scrollNext()} />
        </>
      )}

      <Carousel
        setApi={setApi}
        opts={{
          align: "start",
          direction: "ltr",
          dragFree: true,
          loop: images.length > 4,
        }}
        className="w-full"
      >
        <CarouselContent>
          {images.map((review, index) => (
            <ReviewCard
              key={review.src}
              review={review}
              index={index}
              onOpen={onOpen}
            />
          ))}
        </CarouselContent>
      </Carousel>

      <CarouselDots
        count={images.length}
        current={current}
        onSelect={(index) => api?.scrollTo(index)}
      />
    </div>
  );
}

function ViewAllReviewsLink() {
  const t = useTranslations("socialProof");

  return (
    <div className="mt-10 text-center">
      <Link
        href="/reviews"
        className="group inline-flex items-center gap-2 rounded-full bg-[#0F1A26] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#EEBC3F] hover:text-[#0F1A26]"
      >
        {t("viewAllReviews")}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>
  );
}

function MarketplaceBadges() {
  const t = useTranslations("socialProof");

  return (
    <div className="mt-12 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
      <p className="w-full text-center text-sm text-[#0F1A26]/50">
        {t("marketplaces")}
      </p>

      <MarketplaceBadge name="amazon" rating="4.5" />
      <MarketplaceBadge name="noon" rating="4.4" />
    </div>
  );
}

function MarketplaceBadge({ name, rating }: { name: string; rating: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[#0F1A26]/10 bg-white px-6 py-3">
      <span className="font-bold text-[#0F1A26]">{name}</span>
      <span className="text-sm text-[#0F1A26]/60">{rating}★</span>
    </div>
  );
}

export function SocialProof() {
  const locale = useLocale();
  const isRTL = locale === "ar";
  const { images, isLoading } = useReviewImages();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  }, []);

  return (
    <>
      <section className="bg-[#F1EBE3] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" dir={isRTL ? "rtl" : "ltr"}>
          <SectionHeading />

          {isLoading ? (
            <LoadingGrid />
          ) : images.length > 0 ? (
            <ReviewGallery images={images} onOpen={openLightbox} />
          ) : (
            <EmptyState />
          )}

          <ViewAllReviewsLink />
          <MarketplaceBadges />
        </div>
      </section>

      <ReviewsLightbox
        images={images}
        open={lightboxOpen}
        initialIndex={selectedImageIndex}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
