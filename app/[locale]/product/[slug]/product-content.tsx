"use client";

import { useCart } from "@/app/lib/cart-context";
import { useWishlist } from "@/app/lib/wishlist-context";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { FormEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useRouter } from "@/i18n/routing";
import { useLocale, useMessages, useTranslations } from 'next-intl';
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Button } from "@/components/ui/button";
import { Shield, Sparkles, Ruler, Heart, Share2, Check, Star, Truck, RotateCcw, ArrowUpRight, Award, ArrowLeft, ChevronLeft, ChevronRight as ChevronRightIcon, BadgeCheck } from "lucide-react";
import { FAQSection } from "@/app/components/faq-section";
import { DeliveryCountdown } from "@/app/components/delivery-countdown";
import { SwipeableProductImage } from "@/app/components/swipeable-product-image";
import { WishlistToggleButton } from "@/app/components/wishlist-toggle-button";
import { QuantityDiscountRibbon } from "@/app/components/quantity-discount-ribbon";
import { SizeModal } from "@/app/components/size-modal";
import {
  ReviewsLightbox,
  type ReviewImage,
} from "@/app/components/reviews-lightbox";
import { useQuantityDiscountSettings, useSizeGuideSizes } from "@/app/lib/site-settings-context";
import { type Product } from "@/lib/products";
import { calculateBundlePrice, getPricingRuleKey } from "@/lib/bundle-pricing";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";
import { getStockLabel, isProductOutOfStock, isProductSizeOutOfStock } from "@/lib/product-stock";
import { getProductRating } from "@/lib/product-rating";
import {
  applyQuantityDiscount,
  getNextQuantityDiscount,
  getQuantityDiscountPercent,
  type QuantityDiscountSettings,
} from "@/lib/quantity-discount";

// Separate component for detailed product description
interface ProductDetailedDescriptionProps {
  product: Product;
  selectedSize: string;
  quantity: number;
  unitPrice?: number;
  unitOriginalPrice?: number;
  t: (key: string) => string;
  addToCart: (item: {
    id: number;
    name: string;
    slug: string;
    type: string;
    price: number;
    originalPrice: number;
    image: string;
    size?: string;
    color?: string;
    quantity: number;
  }) => boolean;
}

type ProductVideoItem = {
  poster: string;
  src: string;
  label?: string;
};

const getNestedProductMessage = (source: unknown, path: string): unknown => {
  if (!source || typeof source !== "object") return undefined;

  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, source);
};

const getProductDetailMessages = (messages: unknown, slug: string) => {
  const productsMessages = getNestedProductMessage(messages, "products");
  if (!productsMessages || typeof productsMessages !== "object") return null;

  const productMessages = (productsMessages as Record<string, unknown>)[slug];
  return productMessages && typeof productMessages === "object"
    ? productMessages
    : null;
};

const getProductDetailString = (messages: unknown, path: string) => {
  const value = getNestedProductMessage(messages, path);
  return typeof value === "string" ? value : "";
};

const getProductDetailArray = (messages: unknown, path: string) => {
  const value = getNestedProductMessage(messages, path);
  return Array.isArray(value) ? value : [];
};

function ProductVideoSection({
  title,
  subtitle,
  poster,
  src,
  fullWidth,
  videoFit = "cover",
  videos,
}: {
  title: string;
  subtitle: string;
  poster?: string;
  src?: string;
  fullWidth?: boolean;
  videoFit?: "cover" | "contain";
  videos?: ProductVideoItem[];
}) {
  const wrapperClassName = fullWidth
    ? "mt-6 lg:mt-8 relative left-1/2 right-1/2 -mx-[50vw] w-screen"
    : "mt-6 lg:mt-8";

  const innerClassName = fullWidth
    ? "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
    : undefined;

  const videoClassName = `w-full h-full ${videoFit === "contain" ? "object-contain" : "object-cover"
    }`;

  return (
    <div className={wrapperClassName}>
      <div className={innerClassName}>
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#0F1A26]/5 shadow-lg">
          <h3 className="text-base font-bold text-[#0F1A26] mb-5 tracking-[0.1em] uppercase flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-[#EEBC3F]" />
            {title}
          </h3>

          {videos && videos.length > 0 ? (
            <div className="-mx-2 flex snap-x gap-4 overflow-x-auto px-2 pb-3 no-scrollbar sm:-mx-3 sm:px-3 lg:gap-6">
              {videos.map((video, index) => (
                <div
                  key={`${video.src}-${index}`}
                  className="w-[78vw] max-w-[320px] shrink-0 snap-start overflow-hidden rounded-2xl border border-[#0F1A26]/5 bg-[#F1EBE3] shadow-sm sm:w-[320px] lg:w-[360px] lg:max-w-[360px]"
                >
                  <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden bg-[#F1EBE3]">
                    <Image
                      src={video.poster}
                      alt={video.label || title}
                      fill
                      sizes="(max-width: 640px) 78vw, 360px"
                      className="object-contain p-3"
                      loading="lazy"
                      quality={45}
                    />
                    <video
                      autoPlay
                      muted
                      loop
                      playsInline
                      controls
                      preload="metadata"
                      className={`${videoClassName} relative z-10 bg-transparent`}
                      poster={video.poster}
                    >
                      <source src={video.src} type="video/mp4" />
                      <source src={video.src} type="video/quicktime" />
                      <track kind="captions" src="/captions/silent-video.vtt" srcLang="en" label="English captions" />
                      Your browser does not support the video tag.
                    </video>
                  </div>

                  {video.label && (
                    <p className="text-[#0F1A26]/60 text-xs sm:text-sm mt-3 text-center px-3 pb-3">
                      {video.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F1EBE3]">
              {poster && (
                <Image
                  src={poster}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 92vw, 1100px"
                  className="object-contain p-3"
                  loading="lazy"
                  quality={50}
                />
              )}
              <video
                autoPlay
                muted
                loop
                playsInline
                controls
                preload="metadata"
                className={`${videoClassName} relative z-10 bg-transparent`}
                poster={poster}
              >
                {src && <source src={src} type="video/mp4" />}
                {src && <source src={src} type="video/quicktime" />}
                <track kind="captions" src="/captions/silent-video.vtt" srcLang="en" label="English captions" />
                Your browser does not support the video tag.
              </video>
            </div>
          )}

          <p className="text-[#0F1A26]/60 text-sm mt-4 text-center">
            {subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductComparisonTable({ t }: { t: (key: string) => string }) {
  const rows = [
    "elastic",
    "zipper",
    "fabric",
    "print",
    "designs",
    "ecosystem",
    "guarantee",
  ];

  return (
    <section className="mt-8 lg:mt-10">
      <div className="overflow-hidden rounded-[2rem] border border-[#0F1A26]/8 bg-white shadow-[0_24px_70px_rgba(15,26,38,0.08)]">
        <div className="bg-[#0F1A26] px-5 py-6 text-center sm:px-8">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">
            {t("comparison.eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
            {t("comparison.title")}
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/55">
            {t("comparison.subtitle")}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full border-collapse text-start">
            <thead>
              <tr className="border-b border-[#0F1A26]/8 bg-[#F8F6F3]">
                <th className="w-[24%] px-5 py-4 text-sm font-black text-[#0F1A26]">
                  {t("comparison.feature")}
                </th>
                <th className="w-[38%] bg-[#0F1A26] px-5 py-4 text-sm font-black text-white">
                  <span className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-[#EEBC3F] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[#0F1A26]">
                      {t("comparison.bestChoice")}
                    </span>
                    {t("comparison.natonat")}
                  </span>
                </th>
                <th className="w-[38%] px-5 py-4 text-sm font-black text-[#0F1A26]/55">
                  {t("comparison.competitors")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr
                  key={row}
                  className={`border-b border-[#0F1A26]/8 last:border-0 ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F6F3]/70"
                  }`}
                >
                  <td className="px-5 py-4 text-sm font-black text-[#0F1A26]">
                    {t(`comparison.rows.${row}.feature`)}
                  </td>
                  <td className="bg-[#0F1A26] px-5 py-4 text-sm font-bold leading-relaxed text-white">
                    <span className="inline-flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#EEBC3F]" strokeWidth={2.5} />
                      {t(`comparison.rows.${row}.natonat`)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold leading-relaxed text-[#0F1A26]/50">
                    {t(`comparison.rows.${row}.competitors`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type ApprovedProductReview = {
  _id: string;
  customerName: string;
  rating: number;
  review: string;
  submittedAt?: string;
};

function ProductCustomerReviews({
  product,
  locale,
  t,
}: {
  product: Product;
  locale: string;
  t: (key: string) => string;
}) {
  const [reviews, setReviews] = useState<ApprovedProductReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch(`/api/product-reviews?slug=${encodeURIComponent(product.slug)}`, {
          cache: "no-store",
        });
        const data = await response.json();
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
      } catch (error) {
        console.error("Failed to load product text reviews:", error);
        setReviews([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviews();
  }, [product.slug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");
    setSubmitSuccess(false);

    if (customerName.trim().length < 2 || review.trim().length < 10) {
      setSubmitError(t("customerReviews.validation"));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/product-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: product.slug,
          customerName,
          rating,
          review,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("customerReviews.error"));
      }

      setCustomerName("");
      setRating(5);
      setReview("");
      setIsFormOpen(false);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t("customerReviews.error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mt-12 rounded-[2rem] border border-[#0F1A26]/8 bg-white p-5 shadow-[0_24px_70px_rgba(15,26,38,0.08)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">
            {t("customerReviews.eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-[#0F1A26] sm:text-4xl">
            {t("customerReviews.title")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-[#0F1A26]/55">
            {t("customerReviews.subtitle")}
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setIsFormOpen((current) => !current);
            setSubmitError("");
            setSubmitSuccess(false);
          }}
          className="h-12 rounded-full bg-[#EEBC3F] px-6 font-black text-[#0F1A26] hover:bg-[#d4a535]"
        >
          {t("customerReviews.leaveButton")}
        </Button>
      </div>

      {submitSuccess && (
        <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          {t("customerReviews.pendingMessage")}
        </div>
      )}

      {isFormOpen && (
        <form onSubmit={handleSubmit} className="mt-6 rounded-3xl border border-[#0F1A26]/8 bg-[#F8F6F3] p-4 sm:p-5">
          <input type="text" name="website" className="hidden" tabIndex={-1} autoComplete="off" />
          <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#0F1A26]/45">
                {t("customerReviews.nameLabel")}
              </span>
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                maxLength={80}
                className="h-12 w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-4 text-sm font-bold text-[#0F1A26] outline-none transition focus:border-[#EEBC3F]"
                placeholder={t("customerReviews.namePlaceholder")}
              />
            </label>

            <div>
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#0F1A26]/45">
                {t("customerReviews.ratingLabel")}
              </span>
              <div className="flex h-12 items-center gap-1 rounded-2xl border border-[#0F1A26]/10 bg-white px-3">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1"
                    aria-label={`${value} stars`}
                  >
                    <Star
                      className={`h-5 w-5 ${value <= rating ? "fill-[#EEBC3F] text-[#EEBC3F]" : "text-[#0F1A26]/20"}`}
                      strokeWidth={1.8}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-[#0F1A26]/45">
              {t("customerReviews.reviewLabel")}
            </span>
            <textarea
              value={review}
              onChange={(event) => setReview(event.target.value)}
              maxLength={1000}
              rows={4}
              className="w-full rounded-2xl border border-[#0F1A26]/10 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-[#0F1A26] outline-none transition focus:border-[#EEBC3F]"
              placeholder={t("customerReviews.reviewPlaceholder")}
            />
          </label>

          {submitError && (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {submitError}
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-semibold text-[#0F1A26]/45">
              {t("customerReviews.moderationNote")}
            </p>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 rounded-full bg-[#0F1A26] px-7 font-black text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] disabled:opacity-50"
            >
              {isSubmitting ? t("customerReviews.submitting") : t("customerReviews.submit")}
            </Button>
          </div>
        </form>
      )}

      <div className="mt-7">
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-36 rounded-3xl bg-[#F1EBE3] animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.map((item) => (
              <article key={item._id} className="rounded-3xl border border-[#0F1A26]/8 bg-[#F8F6F3] p-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <strong className="text-sm font-black text-[#0F1A26]">{item.customerName}</strong>
                  <span className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        className={`h-3.5 w-3.5 ${value <= item.rating ? "fill-[#EEBC3F] text-[#EEBC3F]" : "text-[#0F1A26]/15"}`}
                        strokeWidth={1.5}
                      />
                    ))}
                  </span>
                </div>
                <p className="text-sm font-semibold leading-relaxed text-[#0F1A26]/65">{item.review}</p>
                {item.submittedAt && (
                  <time className="mt-4 block text-xs font-bold text-[#0F1A26]/35">
                    {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(item.submittedAt))}
                  </time>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#0F1A26]/12 bg-[#F8F6F3] px-5 py-8 text-center">
            <p className="text-sm font-bold text-[#0F1A26]/55">{t("customerReviews.empty")}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function ProductReviewsLoop({ t }: { t: (key: string) => string }) {
  const [reviewImages, setReviewImages] = useState<ReviewImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    async function loadReviewImages() {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        const data = await res.json();
        setReviewImages(Array.isArray(data.images) ? data.images : []);
      } catch (error) {
        console.error("Failed to load product review images:", error);
        setReviewImages([]);
      } finally {
        setIsLoading(false);
      }
    }

    loadReviewImages();
  }, []);

  if (isLoading) {
    return (
      <section className="mt-12 rounded-[2rem] bg-white p-5 shadow-[0_24px_70px_rgba(15,26,38,0.08)] sm:p-8">
        <div className="mb-6 h-8 w-56 rounded-full bg-[#F1EBE3] animate-pulse" />
        <div className="flex gap-4 overflow-hidden">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="h-64 w-44 shrink-0 rounded-2xl bg-[#F1EBE3] animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (reviewImages.length === 0) return null;

  return (
    <>
      <section dir="ltr" className="group/reviews mt-12 overflow-hidden rounded-[2rem] bg-[#0F1A26] py-8 shadow-[0_24px_70px_rgba(15,26,38,0.16)] sm:py-10">
        <div className="mb-7 px-5 text-center sm:px-8">
          <span className="text-xs font-black uppercase tracking-[0.24em] text-[#EEBC3F]">
            {t("reviewsLoop.eyebrow")}
          </span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-4xl">
            {t("reviewsLoop.title")}
          </h2>
          <p className="mt-2 text-sm font-semibold text-white/55">
            {t("reviewsLoop.subtitle")}
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#0F1A26] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#0F1A26] to-transparent" />

          <div className="animate-reviews-marquee flex w-max gap-4 px-4 group-hover/reviews:[animation-play-state:paused]">
            {[0, 1].map((groupIndex) => (
              <div key={groupIndex} className="flex shrink-0 gap-4">
                {reviewImages.map((review, index) => (
                  <button
                    key={`${review.src}-${groupIndex}-${index}`}
                    type="button"
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setLightboxOpen(true);
                    }}
                    className="group relative h-72 w-48 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white p-2 shadow-xl shadow-black/15 transition-transform duration-300 hover:-translate-y-1 sm:h-80 sm:w-56"
                    aria-label={t("reviewsLoop.openReview")}
                  >
                    <Image
                      src={review.src}
                      alt={review.alt}
                      fill
                      sizes="(max-width: 640px) 50vw, 224px"
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-[1.03]"
                      loading="lazy"
                      quality={55}
                    />
                    <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-[#0F1A26]/90 px-3 py-1.5 text-[11px] font-black text-white opacity-0 shadow-lg transition-opacity duration-300 group-hover:opacity-100">
                      {t("reviewsLoop.tap")}
                    </span>
                  </button>
                ))}
              </div>
            ))}
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

// Component for showing intro text only (no button) when expanded
function ProductDetailedDescriptionTextOnly({ product }: { product: Product }) {
  const messages = useMessages();
  const productMessages = getProductDetailMessages(messages, product.slug);
  const intro = getProductDetailString(productMessages, "intro");

  if (!intro) return null;

  return (
    <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
      <p className="text-[#0F1A26]/80 text-sm leading-relaxed">
        {intro}
      </p>
    </div>
  );
}

// Component for showing full content when expanded
function ProductDetailedDescriptionFull({
  product,
  selectedSize,
  quantity,
  unitPrice,
  unitOriginalPrice,
  t,
  addToCart,
}: ProductDetailedDescriptionProps) {
  const messages = useMessages();
  const tp = useTranslations('products');
  const productMessages = getProductDetailMessages(messages, product.slug);

  if (!productMessages) {
    return null;
  }

  // Helper to safely get array data
  const getArray = (path: string): string[] => {
    return getProductDetailArray(productMessages, path).filter(
      (item): item is string => typeof item === "string"
    );
  };

  // Helper to safely get features array
  const getFeatures = (): { title: string; desc: string }[] => {
    return getProductDetailArray(productMessages, "whyChoose.features").filter(
      (item): item is { title: string; desc: string } =>
        !!item &&
        typeof item === "object" &&
        typeof (item as { title?: unknown }).title === "string" &&
        typeof (item as { desc?: unknown }).desc === "string"
    );
  };

  const perfectFor = getArray('designInspiration.perfectFor');
  const targetAudience = getArray('targetAudience.items');
  const sizes = getArray('sizeGuide.sizes');
  const features = getFeatures();

  return (
    <div className="space-y-4">
      {/* 2-Column Layout for side-by-side content */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Design Inspiration */}
        {perfectFor.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-[#EEBC3F]" />
              {tp(`${product.slug}.designInspiration.title`)}
            </h4>
            <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.designInspiration.content`)}</p>
            <ul className="space-y-1.5">
              {perfectFor.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-[#0F1A26]/60 text-xs mt-3 italic">{tp(`${product.slug}.designInspiration.tagline`)}</p>
          </div>
        )}

        {/* Target Audience */}
        {targetAudience.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 text-sm">{tp(`${product.slug}.targetAudience.title`)}</h4>
            <ul className="space-y-1.5">
              {targetAudience.map((item: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Size Guide */}
        {sizes.length > 0 && (
          <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
            <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
              <Ruler className="w-4 h-4 text-[#EEBC3F]" />
              {tp(`${product.slug}.sizeGuide.title`)}
            </h4>
            <p className="text-[#0F1A26]/70 text-sm mb-1">{tp(`${product.slug}.sizeGuide.subtitle`)}</p>
            <p className="text-[#0F1A26]/60 text-xs mb-2">{tp(`${product.slug}.sizeGuide.tip`)}</p>
            <ul className="space-y-1 mb-2">
              {sizes.map((size: string, idx: number) => (
                <li key={idx} className="flex items-center gap-2 text-[#0F1A26]/70 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#EEBC3F]" />
                  {size}
                </li>
              ))}
            </ul>
            <p className="text-[#0F1A26]/60 text-xs italic">{tp(`${product.slug}.sizeGuide.proTip`)}</p>
          </div>
        )}

        {/* About natOnat */}
        <div className="p-5 bg-[#0F1A26] rounded-xl text-white">
          <h4 className="font-bold mb-2 text-sm">{tp(`${product.slug}.about.title`)}</h4>
          <p className="text-white/80 text-sm">{tp(`${product.slug}.about.content`)}</p>
        </div>
      </div>

      {/* Why Choose - Full width */}
      {features.length > 0 && (
        <div className="p-5 bg-white rounded-xl border border-[#0F1A26]/5 shadow-md">
          <h4 className="font-bold text-[#0F1A26] mb-2 flex items-center gap-2 text-sm">
            <Shield className="w-4 h-4 text-[#EEBC3F]" />
            {tp(`${product.slug}.whyChoose.title`)}
          </h4>
          <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.whyChoose.intro`)}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-2">
            {features.map((feature: { title: string; desc: string }, idx: number) => (
              <div key={idx} className="flex items-start gap-2 p-2.5 bg-[#F1EBE3] rounded-lg">
                <span className="w-4 h-4 rounded-full bg-[#EEBC3F] text-white text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                <div>
                  <span className="font-bold text-[#0F1A26] text-xs block">{feature.title}</span>
                  <p className="text-[#0F1A26]/60 text-[11px] leading-tight">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA - Full width */}
      <div className="p-5 bg-gradient-to-r from-[#EEBC3F]/20 to-[#EEBC3F]/5 rounded-xl border border-[#EEBC3F]/30 text-center">
        <h4 className="font-bold text-[#0F1A26] mb-1 text-sm">{tp(`${product.slug}.cta.title`)}</h4>
        <p className="text-[#0F1A26]/70 text-sm mb-3">{tp(`${product.slug}.cta.content`)}</p>
        <Button
          onClick={() => {
            const wasAdded = addToCart({
              id: Number(product.id),
              name: product.name,
              slug: product.slug,
              type: product.type,
              price: unitPrice || product.price,
              originalPrice: unitOriginalPrice || product.originalPrice,
              image: product.image,
              size: product.size ? selectedSize : undefined,
              color: product.color,
              quantity: quantity,
            });
            if (!wasAdded) return;
            trackMetaPixelEvent("AddToCart", {
              content_ids: [String(product.id)],
              contents: [{
                id: String(product.id),
                quantity,
                item_price: product.price,
              }],
              content_name: product.name,
              content_type: "product",
              value: product.price * quantity,
              currency: "EGP",
            });
          }}
          className="bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#d4a535] h-10 px-6 rounded-lg font-bold text-sm"
        >
          {t('addToCart')}
        </Button>
      </div>
    </div>
  );
}

interface ProductPageContentProps {
  product: Product;
  prevProduct: Product | null;
  nextProduct: Product | null;
  products: Product[];
}

function getInitialSelectedSize(product: Product) {
  const sizeOptions = product.sizePrices ? Object.keys(product.sizePrices) : [];
  const availableSizes = sizeOptions.filter((size) => !isProductSizeOutOfStock(product, size));

  if (availableSizes.includes("m")) return "m";
  return availableSizes[0] || sizeOptions[0] || product.size?.toLowerCase() || "m";
}

type ProductTabId = "details" | "features" | "faq";

function ProductQuantityUpsellTracker({
  quantity,
  baseUnitPrice,
  discountedUnitPrice,
  settings,
  t,
}: {
  quantity: number;
  baseUnitPrice: number;
  discountedUnitPrice: number;
  settings: QuantityDiscountSettings;
  t: (key: string, values?: Record<string, number | string>) => string;
}) {
  const discountPercent = getQuantityDiscountPercent(quantity, settings);
  const nextDiscount = getNextQuantityDiscount(quantity, settings);
  const maxTierQuantity = settings.tiers.at(-1)?.minQuantity || 4;
  const progress = Math.min(100, Math.max(0, ((quantity - 1) / Math.max(1, maxTierQuantity - 1)) * 100));
  const savingsPerItem = Math.max(0, baseUnitPrice - discountedUnitPrice);
  const tiers = [
    { quantity: 1, label: t("upsell.tiers.one"), percent: 0 },
    ...settings.tiers.map((tier) => ({
      quantity: tier.minQuantity,
      label: tier.label || t("upsell.tiers.dynamic", { count: tier.minQuantity }),
      percent: tier.percent,
    })),
  ];

  return (
    <div className="mb-4 sm:mb-6 overflow-hidden rounded-3xl border border-[#EEBC3F]/35 bg-white p-4 shadow-[0_18px_45px_rgba(15,26,38,0.08)] sm:p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#0F1A26] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[#EEBC3F]">
            <Sparkles className="h-3.5 w-3.5" />
            {t("upsell.eyebrow")}
          </span>
          <p className="mt-3 text-base font-black leading-snug text-[#0F1A26] sm:text-lg">
            {nextDiscount
              ? t("upsell.next", {
                  count: Math.max(1, nextDiscount.minQuantity - quantity),
                  percent: nextDiscount.percent,
                })
              : t("upsell.unlocked", { percent: discountPercent })}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-[#FFF7DF] px-3 py-2 text-center ring-1 ring-[#EEBC3F]/35">
          <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-[#0F1A26]/45">
            {discountPercent > 0 ? t("upsell.current") : t("upsell.start")}
          </span>
          <span className="text-xl font-black text-[#0F1A26]">
            {discountPercent > 0 ? `${discountPercent}%` : "0%"}
          </span>
        </div>
      </div>

      <div className="relative mb-3 h-3 rounded-full bg-[#0F1A26]/8">
        <div
          className="h-full rounded-full bg-[#0F1A26] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
        <span className="absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-[#0F1A26] text-xs font-black text-[#EEBC3F] shadow-lg shadow-[#0F1A26]/20"
          style={{ insetInlineStart: `calc(${progress}% - 18px)` }}
        >
          {quantity}
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {tiers.map((tier) => {
          const isActive = quantity >= tier.quantity;
          return (
            <div key={tier.quantity} className="text-center">
              <span className={`block text-[11px] font-black ${isActive ? "text-[#0F1A26]" : "text-[#0F1A26]/35"}`}>
                {tier.label}
              </span>
              <span className={`mt-0.5 block text-[10px] font-bold ${isActive ? "text-[#EEBC3F]" : "text-[#0F1A26]/30"}`}>
                {tier.percent > 0 ? t("upsell.percentOff", { percent: tier.percent }) : t("upsell.noDiscount")}
              </span>
            </div>
          );
        })}
      </div>

      {discountPercent > 0 && (
        <div className="mt-4 rounded-2xl bg-[#F8F2EA] px-3 py-2 text-center text-xs font-bold text-[#0F1A26]/70">
          {t("upsell.priceAfter", {
            price: discountedUnitPrice,
            saved: savingsPerItem,
          })}
        </div>
      )}
    </div>
  );
}

export default function ProductPageContent({
  product,
  prevProduct,
  nextProduct,
  products,
}: ProductPageContentProps) {
  const t = useTranslations('product');
  const stockT = useTranslations('stock');
  const locale = useLocale();
  const { addToCart, setBuyNowItem, validateQuantity } = useCart();
  const quantityDiscountSettings = useQuantityDiscountSettings();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const router = useRouter();
  const [selectedSize, setSelectedSize] = useState(() => getInitialSelectedSize(product));
  const [selectedColor, setSelectedColor] = useState<string | null>(product.colors?.[0]?.id || null);
  const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);
  const selectedProductColor =
    product.colors?.find((color) => color.id === selectedColor)?.name ||
    product.color;
  const productRating = useMemo(() => getProductRating(product), [product]);
  const formattedReviewCount = useMemo(
    () => new Intl.NumberFormat(locale).format(productRating.reviewCount),
    [locale, productRating.reviewCount]
  );

  useEffect(() => {
    trackMetaPixelEvent("ViewContent", {
      content_ids: [String(product.id)],
      contents: [{
        id: String(product.id),
        quantity: 1,
        item_price: product.price,
      }],
      content_name: product.name,
      content_type: "product",
      value: product.price,
      currency: "EGP",
    });
  }, [product.id, product.name, product.price]);
  const [quantity, setQuantity] = useState(1);
  const [activeProductTab, setActiveProductTab] = useState<ProductTabId>("details");

  const productCategories = Array.isArray(product.category) ? product.category : [product.category];
  const isBagCover = productCategories.includes("luggage-covers");
  const isBundle = productCategories.includes("bundles") && !!product.bundleItems?.length;
  const getBundleProduct = useCallback(
    (productId: number) => products.find((p) => p.id === productId),
    [products]
  );

  const getBundleSizeOptions = useCallback((bundleProduct: Product): string[] => {
    if (bundleProduct.sizePrices) {
      return Object.keys(bundleProduct.sizePrices);
    }
    return [];
  }, []);

  const getFirstAvailableBundleSize = useCallback(
    (bundleProduct: Product) => {
      const sizeOptions = getBundleSizeOptions(bundleProduct);
      const availableSizes = sizeOptions.filter((size) => !isProductSizeOutOfStock(bundleProduct, size));
      if (availableSizes.includes("m")) return "m";
      return availableSizes[0] || sizeOptions[0];
    },
    [getBundleSizeOptions],
  );

  const [bundleSelections, setBundleSelections] = useState<{ [key: number]: { productId?: number; size?: string; color?: string } }>(() => {
    const initial: { [key: number]: { productId?: number; size?: string; color?: string } } = {};
    if (isBundle && product.bundleItems) {
      product.bundleItems.forEach((item, index) => {
        const productId = item.productId || item.productIds?.[0];
        const bundleProduct = productId ? products.find((p) => p.id === productId) : undefined;
        initial[index] = {
          productId: productId,
          size: bundleProduct ? getFirstAvailableBundleSize(bundleProduct) : undefined,
          color: bundleProduct?.colors?.[0]?.id,
        };
      });
    }
    return initial;
  });

  // Helper function to get price based on selected size
  const getPriceBySize = (sizeId: string) => {
    if (product.sizePrices && product.sizePrices[sizeId as keyof typeof product.sizePrices]) {
      return product.sizePrices[sizeId as keyof typeof product.sizePrices];
    }
    return { price: product.price, originalPrice: product.originalPrice };
  };

  // Calculate dynamic bundle price using the pricing system
  const calculateDynamicBundlePrice = useCallback(() => {
    if (!product.dynamicPricing || !product.bundleItems) {
      return { price: product.price, originalPrice: product.originalPrice };
    }

    const pricingRuleKey = getPricingRuleKey(product);
    if (!pricingRuleKey) {
      return { price: product.price, originalPrice: product.originalPrice };
    }

    // Convert bundleSelections to the format expected by the pricing system
    const selections = product.bundleItems.map((item, index) => ({
      productId: bundleSelections[index]?.productId,
      size: bundleSelections[index]?.size,
      color: bundleSelections[index]?.color,
      quantity: item.quantity,
    }));

    return calculateBundlePrice(product.bundleItems, selections, products, pricingRuleKey);
  }, [product, bundleSelections, products]);

  const currentPrice = product.dynamicPricing ? calculateDynamicBundlePrice() : getPriceBySize(selectedSize);
  const quantityDiscountPercent = getQuantityDiscountPercent(quantity, quantityDiscountSettings);
  const discountedUnitPrice = Math.max(
    0,
    applyQuantityDiscount(currentPrice.price, quantityDiscountPercent),
  );
  const cartUnitPrice = currentPrice.price;
  const previewUnitPrice = quantityDiscountPercent > 0 ? discountedUnitPrice : currentPrice.price;
  const cartOriginalPrice = Math.max(currentPrice.originalPrice || currentPrice.price, currentPrice.price);
  const selectedBundleHasOutOfStockItem = useMemo(() => {
    if (!isBundle || !product.bundleItems) return false;

    return product.bundleItems.some((item, index) => {
      const selection = bundleSelections[index] || {};
      const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
      const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
      return bundleProduct ? isProductSizeOutOfStock(bundleProduct, selection.size) : false;
    });
  }, [bundleSelections, getBundleProduct, isBundle, product.bundleItems]);
  const isSelectedSizeUnavailable = product.size ? isProductSizeOutOfStock(product, selectedSize) : false;
  const isUnavailable = isProductOutOfStock(product) || isSelectedSizeUnavailable || selectedBundleHasOutOfStockItem;
  const stockLabel = getStockLabel(product, {
    inStock: stockT("inStock"),
    lowStock: stockT("lowStock"),
    outOfStock: stockT("outOfStock"),
  });

  const buildCartBundleSelections = useCallback(() => {
    if (!isBundle || !product.bundleItems) return undefined;

    return product.bundleItems.map((item, index) => {
      const selection = bundleSelections[index] || {};
      const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
      const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;

      return {
        productId: selectedProductId || 0,
        productName: bundleProduct?.name || "",
        productSlug: bundleProduct?.slug,
        productType: bundleProduct?.type,
        label: item.label,
        size: selection.size,
        color:
          bundleProduct?.colors?.find((color) => color.id === selection.color)?.name ||
          selection.color ||
          bundleProduct?.color,
        quantity: item.quantity,
        price:
          selection.size && bundleProduct?.sizePrices
            ? bundleProduct.sizePrices[selection.size as keyof typeof bundleProduct.sizePrices]?.price
            : bundleProduct?.price,
        originalPrice:
          selection.size && bundleProduct?.sizePrices
            ? bundleProduct.sizePrices[selection.size as keyof typeof bundleProduct.sizePrices]?.originalPrice
            : bundleProduct?.originalPrice,
      };
    });
  }, [bundleSelections, getBundleProduct, isBundle, product.bundleItems]);

  const buildCartItem = () => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: product.type,
    price: cartUnitPrice,
    basePrice: currentPrice.price,
    originalPrice: cartOriginalPrice,
    image: product.colors && selectedColor
      ? product.colors.find(c => c.id === selectedColor)?.image || product.image
      : product.image,
    size: product.size ? selectedSize : undefined,
    color: selectedProductColor,
    quantity,
    isBundle,
    bundleSelections: buildCartBundleSelections(),
  });

  const trackAddToCart = () => {
    trackMetaPixelEvent("AddToCart", {
      content_ids: [String(product.id)],
      contents: [{
        id: String(product.id),
        quantity,
        item_price: previewUnitPrice,
      }],
      content_name: product.name,
      content_type: "product",
      value: previewUnitPrice * quantity,
      currency: "EGP",
    });
  };

  const handleStickyAddToCart = () => {
    if (isUnavailable) return;
    if (!addToCart(buildCartItem(), { openCart: true })) return;
    trackAddToCart();
  };

  const handleStickyBuyNow = () => {
    if (isUnavailable) return;
    if (!cartUnitPrice) {
      alert(t("price.unavailable"));
      return;
    }

    setBuyNowItem(buildCartItem());
    router.push("/checkout");
  };

  // Filter images based on selected color - memoized to prevent infinite loops
  const colorImages = useMemo(() => {
    if (!product.colors || !selectedColor) return product.images || [product.image];
    const colorIndex = product.colors.findIndex(c => c.id === selectedColor);
    if (colorIndex === -1) return product.images || [product.image];
    // Each color has 3 images, get the slice for selected color
    const startIdx = colorIndex * 3;
    const endIdx = startIdx + 3;
    return product.images?.slice(startIdx, endIdx) || [product.image];
  }, [product.colors, product.images, product.image, selectedColor]);

  const [activeImage, setActiveImage] = useState(0);
  const [showShareToast, setShowShareToast] = useState(false);
  const touchStartXRef = useRef<number | null>(null);
  const bundleOptionsDragRef = useRef<{
    element: HTMLDivElement;
    pointerId: number;
    startX: number;
    scrollLeft: number;
  } | null>(null);
  const bundleOptionsDraggedRef = useRef(false);

  const handleBundleOptionsPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    bundleOptionsDraggedRef.current = false;
    bundleOptionsDragRef.current = {
      element: event.currentTarget,
      pointerId: event.pointerId,
      startX: event.clientX,
      scrollLeft: event.currentTarget.scrollLeft,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }, []);

  const handleBundleOptionsPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = bundleOptionsDragRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    if (Math.abs(deltaX) > 4) {
      bundleOptionsDraggedRef.current = true;
      event.preventDefault();
    }

    dragState.element.scrollLeft = dragState.scrollLeft - deltaX;
  }, []);

  const stopBundleOptionsDrag = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const dragState = bundleOptionsDragRef.current;
    if (dragState?.pointerId === event.pointerId) {
      dragState.element.releasePointerCapture?.(event.pointerId);
    }
    bundleOptionsDragRef.current = null;
    window.setTimeout(() => {
      bundleOptionsDraggedRef.current = false;
    }, 0);
  }, []);


  const sizes = useSizeGuideSizes();
  const availableProductSizes = useMemo(
    () => sizes.filter((size) => !isProductSizeOutOfStock(product, size.id)),
    [product, sizes],
  );
  const recommendedSize = useMemo(() => {
    if (!product.size || sizes.length === 0) return null;
    return availableProductSizes.find((size) => size.id === "m") || availableProductSizes[0] || sizes[0];
  }, [availableProductSizes, product.size, sizes]);

  const selectedSizeInfo = useMemo(
    () => sizes.find((size) => size.id === selectedSize) || recommendedSize,
    [recommendedSize, selectedSize, sizes]
  );
  const selectedSizeGuideText = selectedSizeInfo
    ? t("size.selectedGuide", {
      size: selectedSizeInfo.label,
      range: selectedSizeInfo.range || selectedSizeInfo.cm,
    })
    : "";
  const recommendedSizeText = recommendedSize
    ? t("size.recommended", { size: recommendedSize.label })
    : "";


  const relatedProducts = useMemo(() => {
    const RELATED_LIMIT = 4;

    const toArray = <T,>(value?: T | T[] | null): T[] => {
      if (!value) return [];
      return Array.isArray(value) ? value.filter(Boolean) : [value];
    };

    const productById = new Map(products.map((item) => [item.id, item]));

    const unique = <T,>(items: T[]): T[] => Array.from(new Set(items));

    const getCategories = (item: Product): string[] => {
      return toArray(item.category);
    };

    const getBundleProductIds = (item: Product): number[] => {
      if (!item.bundleItems?.length) return [];

      return item.bundleItems.flatMap((bundleItem) => {
        const ids: number[] = [];

        if (bundleItem.productId) ids.push(bundleItem.productId);
        if (bundleItem.productIds?.length) ids.push(...bundleItem.productIds);

        return ids;
      });
    };

    const isBundleProduct = (item: Product): boolean => {
      return (
        item.isBundle === true ||
        getCategories(item).includes("bundles") ||
        Boolean(item.bundleItems?.length)
      );
    };

    const getBundleCategories = (item: Product): string[] => {
      const bundleProductIds = getBundleProductIds(item);

      const categories = bundleProductIds.flatMap((id) => {
        const bundleProduct = productById.get(id);
        return bundleProduct ? getCategories(bundleProduct) : [];
      });

      return unique(categories);
    };

    const getAllProductCategories = (item: Product): string[] => {
      return unique([...getCategories(item), ...getBundleCategories(item)]);
    };

    const hasIntersection = (a: string[], b: string[]): boolean => {
      return a.some((value) => b.includes(value));
    };

    const sameGender = (item: Product): boolean => {
      const currentGender = toArray(product.gender);
      const itemGender = toArray(item.gender);

      if (!currentGender.length || !itemGender.length) return false;

      return currentGender.some(
        (gender) =>
          itemGender.includes(gender) ||
          gender === "unisex" ||
          itemGender.includes("unisex")
      );
    };

    const getSharedFeaturesCount = (item: Product): number => {
      if (!product.features?.length || !item.features?.length) return 0;

      const currentFeatures = product.features.map((feature) =>
        feature.toLowerCase()
      );

      return item.features.filter((feature) =>
        currentFeatures.includes(feature.toLowerCase())
      ).length;
    };

    const tagScore = (tag?: string | null): number => {
      if (!tag) return 0;

      const normalizedTag = tag.toLowerCase();

      if (normalizedTag.includes("best seller")) return 12;
      if (normalizedTag.includes("best value")) return 10;
      if (normalizedTag.includes("popular")) return 9;
      if (normalizedTag.includes("essential")) return 7;
      if (normalizedTag.includes("new")) return 6;

      return 4;
    };

    // Build smart cross-sell relationships from bundles automatically.
    // Example: All Set Bundle links cover + PackOnat + passport.
    const categoryAffinityMap = new Map<string, Map<string, number>>();

    const addCategoryAffinity = (from: string, to: string, points: number) => {
      if (from === to) return;

      const currentMap = categoryAffinityMap.get(from) || new Map<string, number>();
      currentMap.set(to, (currentMap.get(to) || 0) + points);
      categoryAffinityMap.set(from, currentMap);
    };

    products.forEach((item) => {
      if (!isBundleProduct(item)) return;

      const bundleCategories = getBundleCategories(item);

      bundleCategories.forEach((fromCategory) => {
        bundleCategories.forEach((toCategory) => {
          addCategoryAffinity(fromCategory, toCategory, 45);
        });
      });
    });

    const currentDirectCategories = getCategories(product);
    const currentBundleCategories = getBundleCategories(product);
    const currentAllCategories = getAllProductCategories(product);
    const currentIsBundle = isBundleProduct(product);

    const getAffinityScore = (item: Product): number => {
      const itemCategories = getAllProductCategories(item);

      return currentAllCategories.reduce((total, currentCategory) => {
        const affinity = categoryAffinityMap.get(currentCategory);

        if (!affinity) return total;

        const categoryScore = itemCategories.reduce((sum, itemCategory) => {
          return sum + (affinity.get(itemCategory) || 0);
        }, 0);

        return total + categoryScore;
      }, 0);
    };

    const scoreProduct = (item: Product): number => {
      if (item.id === product.id) return -9999;

      let score = 0;

      const itemDirectCategories = getCategories(item);
      const itemBundleCategories = getBundleCategories(item);
      const itemAllCategories = getAllProductCategories(item);
      const itemIsBundle = isBundleProduct(item);

      // Same visible category
      if (hasIntersection(currentDirectCategories, itemDirectCategories)) {
        score += 120;
      }

      // Same real product family, even if one of them is a bundle
      if (hasIntersection(currentAllCategories, itemAllCategories)) {
        score += 70;
      }

      // Current normal product -> bundle containing this product category
      if (!currentIsBundle && itemIsBundle && hasIntersection(currentAllCategories, itemBundleCategories)) {
        score += 100;
      }

      // Current bundle -> products from inside the bundle categories
      if (currentIsBundle && !itemIsBundle && hasIntersection(currentBundleCategories, itemAllCategories)) {
        score += 100;
      }

      // Bundle to bundle with shared components
      if (currentIsBundle && itemIsBundle && hasIntersection(currentBundleCategories, itemBundleCategories)) {
        score += 85;
      }

      // Cross-sell relation learned from bundles
      score += getAffinityScore(item);

      // Similar style
      if (
        product.theme &&
        item.theme &&
        product.theme !== "mixed" &&
        item.theme !== "mixed" &&
        product.theme === item.theme
      ) {
        score += 28;
      }

      if (
        product.collection &&
        item.collection &&
        product.collection === item.collection
      ) {
        score += 24;
      }

      if (
        product.printType &&
        item.printType &&
        product.printType === item.printType
      ) {
        score += 14;
      }

      if (sameGender(item)) {
        score += 12;
      }

      if (product.color && item.color && product.color === item.color) {
        score += 10;
      }

      if (product.type && item.type && product.type === item.type) {
        score += 18;
      }

      score += tagScore(item.tag);
      score += Math.min(getSharedFeaturesCount(item) * 4, 16);

      return score;
    };

    const scoredProducts = products
      .filter((item) => item.id !== product.id)
      .map((item) => ({
        item,
        score: scoreProduct(item),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.item.id - b.item.id;
      });

    const selected = new Map<number, Product>();

    // CMS selections always come first and keep the editor-defined order.
    (product.relatedProductIds || [])
      .map((productId) => productById.get(productId))
      .filter((item): item is Product => Boolean(item && item.id !== product.id))
      .slice(0, RELATED_LIMIT)
      .forEach((item) => selected.set(item.id, item));

    const addProducts = (
      predicate: (item: Product) => boolean,
      count: number
    ) => {
      scoredProducts
        .filter(({ item }) => !selected.has(item.id))
        .filter(({ item }) => predicate(item))
        .slice(0, count)
        .forEach(({ item }) => selected.set(item.id, item));
    };

    const affinityCategories = unique(
      currentAllCategories.flatMap((category) =>
        Array.from(categoryAffinityMap.get(category)?.keys() || [])
      )
    );

    if (currentIsBundle) {
      // For bundles: recommend bundle items plus similar bundles.
      currentBundleCategories.forEach((category) => {
        addProducts(
          (item) =>
            !isBundleProduct(item) &&
            getAllProductCategories(item).includes(category),
          1
        );
      });

      addProducts((item) => isBundleProduct(item), 1);
    } else {
      // 1) Product from the same category.
      currentDirectCategories.forEach((category) => {
        addProducts(
          (item) =>
            !isBundleProduct(item) &&
            getCategories(item).includes(category),
          1
        );
      });

      // 2) Bundle containing the same product type.
      addProducts(
        (item) =>
          isBundleProduct(item) &&
          hasIntersection(getBundleCategories(item), currentAllCategories),
        1
      );

      // 3) Cross-sell categories inferred from bundles.
      affinityCategories.forEach((category) => {
        addProducts(
          (item) =>
            !isBundleProduct(item) &&
            getAllProductCategories(item).includes(category),
          1
        );
      });
    }

    // Fallback: fill the remaining slots with the highest scored products.
    scoredProducts
      .filter(({ item }) => !selected.has(item.id))
      .slice(0, RELATED_LIMIT - selected.size)
      .forEach(({ item }) => selected.set(item.id, item));

    return Array.from(selected.values()).slice(0, RELATED_LIMIT);
  }, [product, products]);


  // Reset active image when color changes
  useEffect(() => {
    const frameId = requestAnimationFrame(() => setActiveImage(0));
    return () => cancelAnimationFrame(frameId);
  }, [selectedColor]);

  const productFaqs = useMemo(() => {
    const categories = Array.isArray(product.category) ? product.category : [product.category];

    if (categories.includes("luggage-covers")) {
      return [
        { questionKey: "questions.sizeCover.question", answerKey: "questions.sizeCover.answer" },
        { questionKey: "questions.washCover.question", answerKey: "questions.washCover.answer" },
        { questionKey: "questions.security.question", answerKey: "questions.security.answer" },
        { questionKey: "questions.handles.question", answerKey: "questions.handles.answer" },
      ];
    }

    if (categories.includes("passport-wallets")) {
      return [
        { questionKey: "questions.rfid.question", answerKey: "questions.rfid.answer" },
        { questionKey: "questions.cards.question", answerKey: "questions.cards.answer" },
        { questionKey: "questions.leather.question", answerKey: "questions.leather.answer" },
        { questionKey: "questions.pocket.question", answerKey: "questions.pocket.answer" },
      ];
    }

    return [
      { questionKey: "questions.returnPolicy.question", answerKey: "questions.returnPolicy.answer" },
      { questionKey: "questions.exchange.question", answerKey: "questions.exchange.answer" },
      { questionKey: "questions.freeShip.question", answerKey: "questions.freeShip.answer" },
    ];
  }, [product.category]);

  const productTabs: Array<{ id: ProductTabId; label: string }> = [
    { id: "details", label: t("tabs.details") },
    { id: "features", label: t("tabs.features") },
    { id: "faq", label: t("tabs.faq") },
  ];


  return (
    <>
      <Navigation />

      {/* Share Toast Notification */}
      {showShareToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#0F1A26] text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <Check className="w-5 h-5 text-[#EEBC3F]" />
          <span className="font-medium">{t('linkCopied')}</span>
        </div>
      )}

      <main className="min-h-screen bg-[#F1EBE3] overflow-x-hidden pb-32 lg:pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-30 pb-12">
          {/* Product Navigation - Top */}
          <div className="flex items-center justify-between mb-8 pt-5 md:pt-0">
            {/* Left side - Previous or Back to Shop */}
            {prevProduct ? (
              <Link
                href={`/product/${prevProduct.slug}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.previous')}</span>
                  <span className="text-sm font-semibold hidden sm:block">{prevProduct.name}</span>
                </div>
              </Link>
            ) : (
              <Link
                href="/shop"
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ArrowLeft className="w-5 h-5" />
                </div>
                <div className="flex flex-col items-start leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.goBack')}</span>
                  <span className="text-sm font-semibold">{t('nav.backToShop')}</span>
                </div>
              </Link>
            )}

            {/* Center - Product counter */}
            <div className="hidden md:flex flex-col items-center">
              <span className="text-xs text-[#0F1A26]/40 uppercase tracking-wider">{t('nav.browsing')}</span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[#EEBC3F] font-bold">{Math.max(1, products.findIndex(p => p.slug === product.slug) + 1)}</span>
                <span className="text-[#0F1A26]/30">/</span>
                <span className="text-[#0F1A26]/50">{products.length}</span>
              </div>
            </div>

            {/* Right side - Next or nothing */}
            {nextProduct ? (
              <Link
                href={`/product/${nextProduct.slug}`}
                className="flex items-center gap-3 px-4 py-3 bg-white border border-[#0F1A26]/10 rounded-full text-[#0F1A26] hover:border-[#EEBC3F] hover:bg-[#EEBC3F] hover:text-[#1e3a5f] transition-all duration-300 group shadow-sm"
              >
                <div className="flex flex-col items-end leading-tight">
                  <span className="text-xs text-[#0F1A26]/50 group-hover:text-white/70">{t('nav.next')}</span>
                  <span className="text-sm font-semibold hidden md:block">{nextProduct.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0F1A26]/5 group-hover:bg-white/20 flex items-center justify-center transition-all">
                  <ChevronRightIcon className="w-5 h-5" />
                </div>
              </Link>
            ) : (
              <div className="hidden sm:block w-[140px]" /> /* Spacer to maintain layout balance - hidden on mobile */
            )}
          </div>

          {/* Section 1 & 2: Gallery + Info Grid */}
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1.08fr)_minmax(380px,0.92fr)] lg:gap-12">
            {/* Section 1: Gallery */}
            <div className="min-w-0 space-y-3 sm:space-y-4 w-full max-w-full overflow-hidden lg:sticky lg:top-24">
              {/* Main Image - Premium with Navigation Arrows + Swipe Support */}
              <div
                className={`relative w-full bg-white/55 backdrop-blur-sm rounded-2xl sm:rounded-[2rem] flex items-center justify-center overflow-hidden border border-white/80 shadow-[0_28px_80px_rgba(15,26,38,0.10)] touch-pan-y ${
                  isBundle ? "h-[280px] sm:aspect-square sm:h-auto" : "aspect-[0.96/1] lg:aspect-[1.02/1]"
                }`}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  touchStartXRef.current = touch.clientX;
                }}
                onTouchEnd={(e) => {
                  const touch = e.changedTouches[0];
                  const startX = touchStartXRef.current;
                  if (startX === null) return;
                  const diff = startX - touch.clientX;
                  touchStartXRef.current = null;
                  const threshold = 50;
                  if (Math.abs(diff) > threshold) {
                    if (diff > 0) {
                      setActiveImage((prev) => (prev === (colorImages.length || 1) - 1 ? 0 : prev + 1));
                    } else {
                      setActiveImage((prev) => (prev === 0 ? (colorImages.length || 1) - 1 : prev - 1));
                    }
                  }
                }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(238,188,63,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.05),transparent_50%)]" />
                <div className="absolute inset-0 p-2 sm:p-4 lg:p-5">
                  <Image
                    src={colorImages[activeImage] || product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 92vw, (max-width: 1280px) 45vw, 40vw"
                    className={isBundle ? "h-full w-full object-cover" : "h-full w-full object-contain p-2 sm:p-4"}
                    priority={activeImage === 0}
                    quality={65}
                  />
                </div>

                {/* Product Badges */}
                <QuantityDiscountRibbon
                  seed={product.id}
                  className="absolute left-3 top-3 z-30 max-w-[48%] sm:left-6 sm:top-6 sm:max-w-[280px]"
                />
                {isBagCover && (
                  <div className="absolute right-3 top-3 z-20 flex max-w-[48%] items-start gap-2 rounded-2xl border border-white/80 bg-white/95 px-2.5 py-2 text-[#0F1A26] shadow-xl shadow-[#0F1A26]/10 backdrop-blur-sm sm:right-6 sm:top-6 sm:max-w-[330px] sm:px-4 sm:py-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EEBC3F] text-[#0F1A26]">
                      <Shield className="h-4 w-4" strokeWidth={2.5} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs font-black leading-tight sm:text-sm">
                        {t("coverOnlyNotice.title")}
                      </span>
                      <span className="mt-0.5 block text-[10px] font-bold leading-tight text-[#0F1A26]/65 sm:text-xs">
                        {t("coverOnlyNotice.subtitle")}
                      </span>
                      <span className="mt-1 block text-[8px] font-black uppercase leading-tight tracking-[0.08em] text-[#0F1A26]/45 sm:text-[10px]">
                        {t("coverOnlyNotice.english")}
                      </span>
                    </span>
                  </div>
                )}

                {/* Previous/Next Arrows */}
                <button
                  onClick={() => setActiveImage((prev) => (prev === 0 ? (product.images?.length || 1) - 1 : prev - 1))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                  aria-label={t('aria.previousImage')}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
                <button
                  onClick={() => setActiveImage((prev) => (prev === (product.images?.length || 1) - 1 ? 0 : prev + 1))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-12 sm:h-12 bg-white/90 hover:bg-[#EEBC3F] text-[#0F1A26] rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 active:scale-95"
                  aria-label={t('aria.nextImage')}
                >
                  <ChevronRightIcon className="w-4 h-4 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Thumbnails - Horizontal Scrollable with Index */}
              <div className="space-y-2 sm:space-y-3 w-full max-w-full overflow-hidden rounded-[1.5rem] border border-white/70 bg-white/45 p-2 shadow-sm backdrop-blur">
                {/* Thumbnails Row */}
                <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-3 px-1 no-scrollbar max-w-full">
                  {(colorImages || [product.image]).map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-lg sm:rounded-xl bg-white/80 flex items-center justify-center transition-all duration-300 border-2 overflow-hidden ${activeImage === idx
                        ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/20"
                        : "border-transparent opacity-80 hover:opacity-100"
                        }`}
                    >
                      <Image
                        src={img}
                        alt={`${product.name} view ${idx + 1}`}
                        width={96}
                        height={96}
                        className={isBundle ? "h-full w-full object-cover" : "w-full h-full object-contain p-1"}
                        loading="lazy"
                        quality={45}
                      />
                    </button>
                  ))}
                </div>

                {/* Index Indicator with Dots */}
                <div className="flex items-center justify-center gap-2 sm:gap-4 max-w-full">
                  <span className="text-xs sm:text-sm font-bold text-[#EEBC3F] min-w-[16px] sm:min-w-[20px]">
                    {String(activeImage + 1).padStart(2, '0')}
                  </span>

                  {/* Dots */}
                  <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto max-w-[180px] sm:max-w-[280px] px-1">
                    {(colorImages || [product.image]).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImage(idx)}
                        className={`h-1 sm:h-1.5 rounded-full transition-all duration-300 ${activeImage === idx
                          ? "w-4 sm:w-6 bg-[#EEBC3F]"
                          : "w-1.5 sm:w-1.5 bg-[#0F1A26]/20 hover:bg-[#0F1A26]/40"
                          }`}
                        aria-label={t('aria.goToImage', { number: idx + 1 })}
                      />
                    ))}
                  </div>

                  <span className="text-xs sm:text-sm text-[#0F1A26]/60 min-w-[16px] sm:min-w-[20px]">
                    {String(colorImages.length || 1).padStart(2, '0')}
                  </span>
                </div>
              </div>

              <ProductQuantityUpsellTracker
                quantity={quantity}
                baseUnitPrice={currentPrice.price}
                discountedUnitPrice={previewUnitPrice}
                settings={quantityDiscountSettings}
                t={t}
              />
            </div>

            {/* Section 2: Product Info */}
            <div>
              {/* Buy Box - Price + Size + Add to Cart */}
              <div className="space-y-3 rounded-[2rem] border border-white/80 bg-white/45 p-3 shadow-[0_28px_80px_rgba(15,26,38,0.08)] backdrop-blur sm:p-4">
                {/* Category & Actions */}
                <div className="flex items-start justify-between mb-4 sm:mb-6">
                  <div className="flex-1 min-w-0">
                    <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">{product.type}</span>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-[#0F1A26] mt-1 sm:mt-2 tracking-tight">{product.name}</h1>
                  </div>
                  <div className="flex gap-2 sm:gap-3 ml-4">
                    <button
                      onClick={() => {
                        if (isInWishlist(product.id)) {
                          removeFromWishlist(product.id);
                        } else {
                          addToWishlist(product);
                        }
                      }}
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center transition-all duration-300 hover:shadow-lg hover:scale-110 ${isInWishlist(product.id)
                        ? 'text-[#EEBC3F] border-[#EEBC3F]'
                        : 'text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F]'
                        }`}
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isInWishlist(product.id) ? 'fill-[#EEBC3F]' : ''}`} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setShowShareToast(true);
                        setTimeout(() => setShowShareToast(false), 2000);
                      }}
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white border border-[#0F1A26]/10 flex items-center justify-center text-[#0F1A26]/40 hover:text-[#EEBC3F] hover:border-[#EEBC3F] transition-all duration-300 hover:shadow-lg hover:scale-110"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                </div>

                {/* Rating - Premium */}
                <div className="mb-6 flex flex-wrap items-center sm:mb-8">
                  <div dir="ltr" className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#0F1A26]/5 bg-white px-3 py-2 text-xs font-bold text-[#0F1A26] shadow-[0_12px_35px_rgba(15,26,38,0.08)] sm:gap-3 sm:px-4 sm:text-sm">
                    <span dir={locale === "ar" ? "rtl" : "ltr"} className="inline-flex items-center gap-1.5 text-[#2597DC] sm:gap-2">
                      <span>{t("rating.verifiedStore")}</span>
                      <BadgeCheck className="h-5 w-5 shrink-0 fill-[#2F9BE8] text-white sm:h-6 sm:w-6" strokeWidth={2.4} />
                    </span>

                    <span className="h-6 w-px bg-[#0F1A26]/10" />

                    <span className="whitespace-nowrap text-[#0F1A26]/55">
                      {t('rating.reviewCount', { count: formattedReviewCount })}
                    </span>

                    <span className="text-base font-black text-[#0F1A26] sm:text-lg">
                      {productRating.ratingValue.toFixed(1)}
                    </span>

                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star key={star} className="h-3.5 w-3.5 fill-[#EEBC3F] text-[#EEBC3F] sm:h-4 sm:w-4" strokeWidth={1.5} />
                      ))}
                    </span>
                  </div>
                </div>

                {/* Price - Premium */}
                <div className="flex flex-wrap items-baseline gap-2 sm:gap-4 mb-6 sm:mb-8 p-3 sm:p-6 bg-gradient-to-r from-[#EEBC3F]/20 to-[#EEBC3F]/5 rounded-xl sm:rounded-2xl border-2 border-[#EEBC3F]/30">
                  <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F1A26] tracking-tight">EGP {previewUnitPrice}</span>
                  <span className="text-lg sm:text-xl md:text-2xl text-[#0F1A26]/50 line-through font-medium">EGP {cartOriginalPrice}</span>
                  <span className={`text-xs sm:text-sm font-bold px-3 sm:px-4 py-1 sm:py-2 rounded-full ${
                    isUnavailable
                      ? "bg-red-100 text-red-700"
                      : product.stockStatus === "low_stock"
                        ? "bg-orange-100 text-orange-700"
                        : "bg-green-100 text-green-700"
                  }`}>
                    {selectedBundleHasOutOfStockItem
                      ? t("bundle.selectionUnavailable")
                      : isSelectedSizeUnavailable
                        ? stockT("outOfStock")
                      : stockLabel}
                  </span>
                </div>

                <DeliveryCountdown variant="light" className="mb-6 sm:mb-8" />

                {/* Size Selection */}
                {product.size && (
                  <div className="mb-6 sm:mb-8">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <label className="text-xs sm:text-sm font-bold text-[#0F1A26] tracking-[0.1em] uppercase flex items-center gap-2">
                        <Award className="w-3 h-3 sm:w-4 sm:h-4 text-[#EEBC3F]" />
                        {t('size.select')}
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsSizeGuideOpen(true)}
                        className="text-xs sm:text-sm bg-[#EEBC3F] hover:bg-[#d4a535] text-[#0F1A26] transition-all flex items-center gap-1.5 font-bold px-3 sm:px-4 py-2 rounded-lg shadow-md hover:shadow-lg hover:scale-105"
                      >
                        <Ruler className="w-3 h-3 sm:w-4 sm:h-4" />
                        {t('size.howToMeasure')}
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 bg-[#EEBC3F]/10 rounded-lg px-3 py-2">
                      <Ruler className="w-4 h-4 text-[#EEBC3F] flex-shrink-0" />
                      <p className="text-[#0F1A26] text-xs font-semibold">{t('size.heightNote')}</p>
                    </div>
                    {(selectedSizeGuideText || recommendedSizeText) && (
                      <div className="mb-3 rounded-xl border border-[#EEBC3F]/30 bg-white px-3 py-2.5 text-xs sm:text-sm font-semibold text-[#0F1A26] shadow-sm">
                        {selectedSizeGuideText && <p>{selectedSizeGuideText}</p>}
                        {recommendedSizeText && (
                          <p className="mt-1 text-[#0F1A26]/55">{recommendedSizeText}</p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                      {sizes.map((size) => {
                        const isRecommended = recommendedSize?.id === size.id;
                        const isSizeUnavailable = isProductSizeOutOfStock(product, size.id);
                        return (
                          <button
                            key={size.id}
                            disabled={isSizeUnavailable}
                            onClick={() => setSelectedSize(size.id)}
                            className={`relative py-3 sm:py-5 rounded-xl sm:rounded-2xl border-2 text-center transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${selectedSize === size.id
                              ? "border-[#EEBC3F] bg-[#EEBC3F] text-white shadow-xl shadow-[#EEBC3F]/30 scale-105"
                              : isRecommended
                                ? "border-[#EEBC3F]/70 bg-white shadow-lg shadow-[#EEBC3F]/10"
                                : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50 bg-white hover:shadow-lg"
                              }`}
                          >
                            {isRecommended && (
                              <span className={`absolute -top-2 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 text-[9px] font-bold shadow-sm ${
                                selectedSize === size.id
                                  ? "bg-white text-[#0F1A26]"
                                  : "bg-[#EEBC3F] text-[#0F1A26]"
                              }`}>
                                {t("bundle.popular")}
                              </span>
                            )}
                            <span className={`block font-bold text-base sm:text-lg ${selectedSize === size.id ? "text-white" : "text-[#0F1A26]"}`}>{size.label}</span>
                            <span className={`block text-[10px] uppercase tracking-wider mt-0.5 ${selectedSize === size.id ? "text-white/60" : "text-[#0F1A26]/40"}`}>{t('size.heightLabel')}</span>
                            <span className={`block text-xs mt-0.5 ${selectedSize === size.id ? "text-white/70" : "text-[#0F1A26]/50"}`}>{size.range}</span>
                            {isSizeUnavailable && (
                              <span className="mt-1 block text-[10px] font-bold text-red-600">
                                {stockT("outOfStock")}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isBundle && product.bundleItems && (
                  <div className="mb-6 sm:mb-8">
                    <h4 className="font-bold text-[#0F1A26] text-sm mb-4 flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-[#EEBC3F] text-[#0F1A26] flex items-center justify-center text-xs font-bold">
                        {product.bundleItems.length}
                      </span>
                      {t("bundleItemsTitle")}
                    </h4>
                    <div className="space-y-4">
                      {product.bundleItems.map((item, index) => {
                        const selection = bundleSelections[index] || {};
                        const selectedProductId = selection.productId || item.productId || item.productIds?.[0];
                        const bundleProduct = selectedProductId ? getBundleProduct(selectedProductId) : undefined;
                        const sizeOptions = bundleProduct ? getBundleSizeOptions(bundleProduct) : [];
                        const selectedBundleColorImage =
                          bundleProduct?.colors?.find((color) => color.id === selection.color)?.image;

                        // Get available product options for this bundle item
                        const productOptions = item.productIds
                          ? item.productIds.map(id => {
                            const p = getBundleProduct(id);
                            return p || null;
                          }).filter(Boolean)
                          : item.productId && bundleProduct
                            ? [bundleProduct]
                            : [];

                        return (
                          <div key={index} className="overflow-hidden rounded-2xl border border-[#0F1A26]/10 bg-white p-3 sm:p-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#F1EBE3] sm:h-16 sm:w-16">
                                {bundleProduct ? (
                                  <Image
                                    src={selectedBundleColorImage || bundleProduct.image}
                                    alt={bundleProduct.name}
                                    fill
                                    sizes="64px"
                                    className="object-contain"
                                    loading="lazy"
                                    quality={45}
                                  />
                                ) : (
                                  <div className="w-full h-full bg-[#EEBC3F]/20" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                {item.label && <p className="text-[#0F1A26]/50 text-xs mb-0.5">{item.label}</p>}
                                {bundleProduct ? (
                                  <h5 className="truncate font-semibold text-[#0F1A26] text-sm">{bundleProduct.name}</h5>
                                ) : null}
                                <span className="text-[#EEBC3F] text-xs font-bold block mt-1">
                                  {t("bundle.qty", { quantity: item.quantity })}
                                </span>
                              </div>
                            </div>

                            {productOptions.length > 1 && (
                              <div className="mb-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <label className="text-[#0F1A26]/60 text-xs font-bold block">
                                    {item.label || t("bundleItemsTitle")}
                                  </label>
                                  <span className="text-[10px] font-semibold text-[#0F1A26]/40">
                                    {t("bundle.swipeToChoose")}
                                  </span>
                                </div>
                                <div
                                  className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 no-scrollbar cursor-grab active:cursor-grabbing"
                                  onPointerDown={handleBundleOptionsPointerDown}
                                  onPointerMove={handleBundleOptionsPointerMove}
                                  onPointerUp={stopBundleOptionsDrag}
                                  onPointerCancel={stopBundleOptionsDrag}
                                  onPointerLeave={stopBundleOptionsDrag}
                                >
                                  {productOptions.map((opt) => {
                                    if (!opt) return null;
                                    const isSelected = selectedProductId === opt.id;

                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        onClick={(event) => {
                                          if (bundleOptionsDraggedRef.current) {
                                            event.preventDefault();
                                            return;
                                          }
                                          setBundleSelections((prev) => ({
                                            ...prev,
                                            [index]: {
                                              ...prev[index],
                                              productId: opt.id,
                                              size: getFirstAvailableBundleSize(opt),
                                              color: opt.colors?.[0]?.id,
                                            },
                                          }));
                                        }}
                                        className={`relative w-[42vw] max-w-[138px] shrink-0 snap-start rounded-2xl border p-2.5 text-center transition-all sm:w-32 ${
                                          isSelected
                                            ? "border-[#EEBC3F] bg-[#EEBC3F]/10 ring-2 ring-[#EEBC3F]/20"
                                            : "border-[#0F1A26]/10 bg-[#F8F6F3] hover:border-[#EEBC3F]/50"
                                        }`}
                                      >
                                        {isSelected && (
                                          <span className="absolute right-2 top-2 z-10 rounded-full bg-[#EEBC3F] px-2 py-0.5 text-[10px] font-black text-[#0F1A26]">
                                            {t("bundle.selected")}
                                          </span>
                                        )}
                                        <span className="relative mb-2 block h-20 overflow-hidden rounded-xl bg-white sm:h-24">
                                          <Image
                                            src={opt.image}
                                            alt={opt.name}
                                            fill
                                            sizes="140px"
                                            className="object-contain p-1"
                                            loading="lazy"
                                            quality={45}
                                          />
                                        </span>
                                        <span className="line-clamp-2 min-h-[28px] text-[11px] font-bold leading-tight text-[#0F1A26]">
                                          {opt.name}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {sizeOptions.length > 0 && (
                              <div className="mb-3">
                                <label className="text-[#0F1A26]/60 text-xs mb-2 block">{t("size.select")}</label>
                                <div className="flex flex-wrap gap-2">
                                  {sizeOptions.map((size: string) => (
                                    (() => {
                                      const isSizeUnavailable = bundleProduct
                                        ? isProductSizeOutOfStock(bundleProduct, size)
                                        : false;

                                      return (
                                        <button
                                          key={size}
                                          disabled={isSizeUnavailable}
                                          onClick={() =>
                                            setBundleSelections((prev) => ({
                                              ...prev,
                                              [index]: { ...prev[index], size },
                                            }))
                                          }
                                          className={`min-h-10 min-w-11 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:cursor-not-allowed disabled:opacity-45 ${selection.size === size
                                            ? "bg-[#EEBC3F] text-[#0F1A26]"
                                            : "bg-white text-[#0F1A26]/70 hover:bg-[#EEBC3F]/20"
                                            }`}
                                        >
                                          <span className="block">{size.toUpperCase()}</span>
                                          {isSizeUnavailable && (
                                            <span className="block text-[9px] text-red-600">{stockT("outOfStock")}</span>
                                          )}
                                        </button>
                                      );
                                    })()
                                  ))}
                                </div>
                              </div>
                            )}

                            {bundleProduct?.colors && bundleProduct.colors.length > 0 && (
                              <div>
                                <label className="text-[#0F1A26]/60 text-xs mb-2 block">{t("color.select")}</label>
                                <div className="flex flex-wrap gap-2">
                                  {bundleProduct.colors.map((color) => (
                                    <button
                                      key={color.id}
                                      onClick={() =>
                                        setBundleSelections((prev) => ({
                                          ...prev,
                                          [index]: { ...prev[index], color: color.id },
                                        }))
                                      }
                                      className={`relative h-10 w-10 rounded-full border-2 transition-all overflow-hidden ${selection.color === color.id
                                        ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/30"
                                        : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50"
                                        }`}
                                      title={color.name}
                                    >
                                      <Image
                                        src={color.image}
                                        alt={color.name}
                                        fill
                                        sizes="32px"
                                        className="object-cover"
                                        loading="lazy"
                                        quality={45}
                                      />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[#0F1A26] font-semibold text-sm sm:text-base flex items-center gap-2">
                        {t('color.select') || 'Select Color'}
                        <span className="text-[#EEBC3F]">·</span>
                        <span className="text-[#0F1A26]/60 font-normal">{product.colors.find(c => c.id === selectedColor)?.name}</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((color) => (
                        <button
                          key={color.id}
                          onClick={() => {
                            setSelectedColor(color.id);
                            setActiveImage(0); // Reset to first image of new color
                          }}
                          className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden transition-all duration-300 ${selectedColor === color.id
                            ? "border-[#EEBC3F] shadow-lg shadow-[#EEBC3F]/30 scale-105 ring-2 ring-[#EEBC3F]/20"
                            : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/50 hover:shadow-md"
                            }`}
                        >
                          <Image
                            src={color.image}
                            alt={color.name}
                            fill
                            sizes="(max-width: 640px) 64px, 80px"
                            className="object-cover"
                            loading="lazy"
                            quality={45}
                          />
                          {selectedColor === color.id && (
                            <div className="absolute inset-0 bg-[#EEBC3F]/20 flex items-center justify-center">
                              <Check className="w-5 h-5 sm:w-6 sm:h-6 text-[#0F1A26] bg-white rounded-full p-1" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to Cart - Premium */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
                  <div className="flex items-center bg-white border-2 border-[#0F1A26]/10 rounded-2xl overflow-hidden hover:border-[#EEBC3F]/30 transition-colors w-full sm:w-auto">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="flex-1 sm:flex-none sm:w-12 h-14 sm:h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-lg sm:text-xl font-bold"
                    >
                      -
                    </button>
                    <span className="flex-1 sm:flex-none sm:w-12 text-center font-bold text-[#0F1A26] text-lg sm:text-xl">{quantity}</span>
                    <button
                      onClick={() => {
                        const requestedQuantity = quantity + 1;
                        if (validateQuantity(buildCartItem(), requestedQuantity)) {
                          setQuantity(requestedQuantity);
                        }
                      }}
                      className="flex-1 sm:flex-none sm:w-12 h-14 sm:h-16 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#EEBC3F]/10 hover:text-[#EEBC3F] transition-all text-lg sm:text-xl font-bold"
                    >
                      +
                    </button>
                  </div>
                  <Button
                    onClick={handleStickyAddToCart}
                    disabled={isUnavailable}
                    className="flex-1 bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] h-14 sm:h-16 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 hover:shadow-xl hover:shadow-[#EEBC3F]/20 group"
                  >
                    {isUnavailable ? t("unavailable") : t('addToCart')}
                  </Button>
                  <Button
                    onClick={handleStickyBuyNow}
                    disabled={isUnavailable}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-[#EEBC3F] to-[#d4a535] text-[#0F1A26] hover:shadow-xl hover:shadow-[#EEBC3F]/30 h-14 sm:h-16 px-4 sm:px-10 rounded-2xl font-bold text-base sm:text-lg transition-all duration-300 group"
                  >
                    {isUnavailable ? t("unavailable") : t('buyNow')}
                  </Button>
                </div>
              </div>{/* End Sticky Buy Box */}

            </div>
          </div>
          {/* Video Section - Full Width */}
          {product.category === "passport-wallets" && (
            <ProductVideoSection
              title={t('videoSection.title')}
              subtitle={t('videoSection.passportSubtitle')}
              poster="/passport%20wallet/Cognac%20brown/1.png"
              src="/passport%20wallet/Wallet%20landscape%20without%20logo.mov"
              fullWidth
            />
          )}

          {product.category === "packonat" && (
            <ProductVideoSection
              title={t('videoSection.title')}
              subtitle={t('videoSection.subtitle')}
              poster="/packOnat/Black/1.png"
              src="/packOnat/Cloth%20case%20landscape%20without%20logo.mov"
              fullWidth
              videoFit="contain"
            />
          )}

          {product.category === "luggage-covers" && (
            <ProductVideoSection
              title={t('videoSection.title')}
              subtitle={t('videoSection.luggageSubtitle')}
              fullWidth
              videoFit="contain"
              videos={[
                {
                  poster: "/octopus photo/Black/1.png",
                  src: "/octopus photo/Wear2.mp4",
                  label: t('videoSection.luggageLabels.protection'),
                },
                {
                  poster: "/octopus photo/Green/021A9832.jpg",
                  src: "/octopus photo/Wear.mp4",
                  label: t('videoSection.luggageLabels.easyWear'),
                },
                {
                  poster: "/octopus photo/Black/1.png",
                  src: "/octopus photo/Wear3.mp4",
                  label: t('videoSection.luggageLabels.secureFit'),
                },
              ]}
            />
          )}

          <section className="mt-8 lg:mt-12">
            <div className="rounded-[2rem] border border-[#0F1A26]/10 bg-white/80 p-2 shadow-[0_24px_70px_rgba(15,26,38,0.08)] backdrop-blur">
              <div className="grid grid-cols-3 gap-2">
                {productTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveProductTab(tab.id)}
                    className={`rounded-2xl px-3 py-3 text-sm font-black transition-all ${
                      activeProductTab === tab.id
                        ? "bg-[#0F1A26] text-white shadow-lg shadow-[#0F1A26]/15"
                        : "bg-white text-[#0F1A26]/55 hover:bg-[#EEBC3F]/15 hover:text-[#0F1A26]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-3 rounded-[1.5rem] bg-[#F8F2EA] p-4 sm:p-6">
                {activeProductTab === "details" && (
                  <div className="space-y-4">
                    <ProductDetailedDescriptionTextOnly product={product} />
                    <ProductDetailedDescriptionFull
                      product={product}
                      selectedSize={selectedSize}
                      quantity={quantity}
                      unitPrice={cartUnitPrice}
                      unitOriginalPrice={cartOriginalPrice}
                      t={t}
                      addToCart={addToCart}
                    />
                  </div>
                )}

                {activeProductTab === "features" && (
                  <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {[
                        { icon: Shield, title: t('benefits.protection.title'), desc: t('benefits.protection.desc') },
                        { icon: Sparkles, title: t('benefits.washable.title'), desc: t('benefits.washable.desc') },
                        { icon: Truck, title: t('benefits.shipping.title'), desc: t('benefits.shipping.desc') },
                        { icon: RotateCcw, title: t('benefits.returns.title'), desc: t('benefits.returns.desc') },
                      ].map((benefit, index) => (
                        <div key={index} className="flex items-center gap-4 rounded-3xl border border-[#0F1A26]/5 bg-white p-4 shadow-sm transition-all duration-300 hover:border-[#EEBC3F]/30 hover:shadow-lg">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#EEBC3F]/10">
                            <benefit.icon className="h-6 w-6 text-[#EEBC3F]" strokeWidth={1.7} />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-base font-black text-[#0F1A26]">{benefit.title}</span>
                            <span className="block text-sm font-medium text-[#0F1A26]/50">{benefit.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="rounded-3xl border border-[#0F1A26]/5 bg-white p-6 shadow-lg md:p-8">
                      <h3 className="mb-5 flex items-center gap-3 text-base font-bold uppercase tracking-[0.1em] text-[#0F1A26]">
                        <Check className="h-5 w-5 text-[#EEBC3F]" />
                        {t('description.title')}
                      </h3>
                      <ul className="space-y-3">
                        {[t('description.1'), t('description.2'), t('description.3'), t('description.4')].map((item, index) => (
                          <li key={index} className="flex items-center gap-3 rounded-xl bg-[#F1EBE3] p-3 text-[#0F1A26]/70">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEBC3F]/10">
                              <Check className="h-4 w-4 text-[#EEBC3F]" strokeWidth={2} />
                            </div>
                            <span className="text-sm font-medium">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {activeProductTab === "faq" && (
                  <FAQSection
                    title={t('faq.title')}
                    translationNamespace="faqs"
                    faqs={productFaqs}
                  />
                )}
              </div>
            </div>
          </section>

          <ProductCustomerReviews product={product} locale={locale} t={t} />
          <ProductComparisonTable t={t} />
          <ProductReviewsLoop t={t} />

          {/* Related Products */}
          <div className="mt-12 pt-12 lg:mt-24 lg:pt-20 border-t border-[#0F1A26]/10">
            <div className="flex items-center justify-between mb-10 transition-all duration-700">
              <div>
                <span className="text-[#EEBC3F] text-xs font-bold tracking-[0.3em] uppercase">{t('related.subtitle')}</span>
                <h2 className="text-3xl md:text-4xl font-bold text-[#0F1A26] mt-2 tracking-tight">{t('related.title')}</h2>
              </div>
              <Link href="/shop" className="bg-white text-[#0F1A26] hover:bg-[#EEBC3F] hover:text-[#0F1A26] px-6 py-3 rounded-full font-semibold transition-all duration-300 border border-[#0F1A26]/10 hover:border-[#EEBC3F] flex items-center gap-2 group">
                {t('related.viewAll')}
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {relatedProducts.map((relatedProduct, index) => (
                <div
                  key={relatedProduct.id}
                  className="group transition-all duration-500"
                  style={{ transitionDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="relative">
                    <Link href={`/product/${relatedProduct.slug}`} className="block">
                      <SwipeableProductImage product={relatedProduct} />
                    </Link>
                    <WishlistToggleButton
                      product={relatedProduct}
                      className="absolute right-2 top-12 sm:right-3 sm:top-14"
                    />
                  </div>
                  <Link href={`/product/${relatedProduct.slug}`} className="mt-3 block">
                    <h3 className="text-[#0F1A26] font-bold group-hover:text-[#EEBC3F] transition-colors duration-300 text-sm sm:text-lg line-clamp-1">{relatedProduct.name}</h3>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop Sticky Buy Bar */}
        <div className="hidden lg:block fixed bottom-5 left-1/2 z-50 w-[min(1120px,calc(100vw-48px))] -translate-x-1/2 rounded-3xl border border-[#0F1A26]/10 bg-white/95 px-5 py-4 shadow-2xl shadow-[#0F1A26]/15 backdrop-blur-xl">
          <div className="flex items-center gap-5">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-[#F1EBE3]">
              <Image
                src={
                  product.colors && selectedColor
                    ? product.colors.find(c => c.id === selectedColor)?.image || product.image
                    : product.image
                }
                alt={product.name}
                fill
                sizes="64px"
                className="object-contain p-1.5"
              />
            </div>

            <div className="flex min-w-0 shrink-0 items-center gap-3">
              <div className="w-[150px] min-w-0 xl:w-[170px]">
                <p className="truncate text-sm font-black text-[#0F1A26]">{product.name}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#0F1A26]/55">
                  {product.size && <span>{selectedSize.toUpperCase()}</span>}
                  {selectedProductColor && <span>{selectedProductColor}</span>}
                  <span>{quantity}x</span>
                </div>
              </div>
              <div className="shrink-0 text-start">
                <p className="text-xl font-black leading-none text-[#0F1A26]">EGP {previewUnitPrice}</p>
                {cartOriginalPrice > previewUnitPrice && (
                  <p className="mt-1 text-xs font-semibold leading-none text-[#0F1A26]/35 line-through">
                    EGP {cartOriginalPrice}
                  </p>
                )}
              </div>
            </div>

            <DeliveryCountdown variant="sticky" className="ml-auto min-w-[280px] justify-between" />

            <div className="grid w-[300px] shrink-0 grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={handleStickyAddToCart}
                disabled={isUnavailable}
                className="h-12 rounded-2xl border border-[#0F1A26]/10 bg-[#F8F6F3] text-sm font-bold text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white"
                variant="outline"
              >
                {isUnavailable ? t("unavailable") : t('addToCart')}
              </Button>
              <Button
                type="button"
                onClick={handleStickyBuyNow}
                disabled={isUnavailable}
                className="h-12 rounded-2xl bg-[#EEBC3F] text-sm font-bold text-[#0F1A26] shadow-sm shadow-[#EEBC3F]/25 hover:bg-[#d4a535]"
              >
                {isUnavailable ? t("unavailable") : t('buyNow')}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Buy Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-[#0F1A26]/10 bg-white/97 px-3 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-[#0F1A26]">{product.name}</p>
            </div>
            <div className="shrink-0 text-end">
              <span className="text-base font-black text-[#0F1A26]">EGP {previewUnitPrice}</span>
              {cartOriginalPrice > previewUnitPrice && (
                <span className="ms-1 text-[11px] font-semibold text-[#0F1A26]/40 line-through">
                  EGP {cartOriginalPrice}
                </span>
              )}
            </div>
          </div>
          <DeliveryCountdown variant="sticky" className="mb-2 w-full justify-between" />
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              onClick={handleStickyAddToCart}
              disabled={isUnavailable}
              className="h-11 rounded-xl bg-[#0F1A26] px-2 text-sm font-black text-white transition-all duration-300 hover:bg-[#EEBC3F] hover:text-[#0F1A26]"
            >
              {isUnavailable ? t("unavailable") : t('addToCart')}
            </Button>
            <Button
              type="button"
              onClick={handleStickyBuyNow}
              disabled={isUnavailable}
              className="h-11 rounded-xl bg-[#EEBC3F] px-2 text-sm font-black text-[#0F1A26] shadow-sm shadow-[#EEBC3F]/25 transition-all duration-300 hover:bg-[#d4a535]"
            >
              {isUnavailable ? t("unavailable") : t('buyNow')}
            </Button>
          </div>
        </div>
      </main>
      <SizeModal
        isOpen={isSizeGuideOpen}
        onClose={() => setIsSizeGuideOpen(false)}
        onConfirm={(size) => {
          setSelectedSize(size);
          setIsSizeGuideOpen(false);
        }}
        productName={product.name}
        confirmLabel={t("size.confirm")}
      />
      <Footer />
    </>
  );
}
