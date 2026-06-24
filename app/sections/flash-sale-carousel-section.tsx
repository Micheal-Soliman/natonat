"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Clock3, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCart, type CartItem } from "@/app/lib/cart-context";
import { useToast } from "@/app/components/toast-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import type { FlashSaleOffer, FlashSaleProduct, FlashSaleSectionSettings } from "@/lib/sanity-site-settings";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";

type SizeKey = "s" | "m" | "l" | "xl";

type ResolvedOffer = {
  offer: FlashSaleOffer;
  product: FlashSaleProduct;
  size?: string;
  color?: string;
  imageUrl: string;
  price: number;
  originalPrice: number;
  discountPercent: number;
  isUnavailable: boolean;
};

function getRemainingTime(endsAt: string) {
  const total = endsAt ? Math.max(0, new Date(endsAt).getTime() - Date.now()) : 0;
  return {
    total,
    days: Math.floor(total / 86_400_000),
    hours: Math.floor((total / 3_600_000) % 24),
    minutes: Math.floor((total / 60_000) % 60),
    seconds: Math.floor((total / 1_000) % 60),
  };
}

function resolveOffer(offer: FlashSaleOffer): ResolvedOffer | null {
  if (!offer.product || (!offer.selectedSize && !offer.selectedColor)) return null;

  const product = offer.product;
  const sizeKey = offer.selectedSize?.toLowerCase() as SizeKey | undefined;
  const sizePrice = sizeKey ? product.sizePrices?.[sizeKey] : undefined;
  const selectedColor = offer.selectedColor?.toLowerCase();
  const colorVariant = product.colors?.find(
    (color) => color.id?.toLowerCase() === selectedColor || color.name?.toLowerCase() === selectedColor,
  );
  const price = sizePrice?.price ?? product.price ?? 0;
  const originalPrice = Math.max(sizePrice?.originalPrice ?? product.originalPrice ?? price, price);
  const sizeStock = sizeKey ? product.sizeStock?.[sizeKey] : undefined;

  return {
    offer,
    product,
    size: offer.selectedSize?.toUpperCase(),
    color: colorVariant?.name || offer.selectedColor || product.color,
    imageUrl: offer.imageUrl || colorVariant?.imageUrl || product.imageUrl || "/logo-after.png",
    price,
    originalPrice,
    discountPercent: originalPrice > price ? Math.round((1 - price / originalPrice) * 100) : 0,
    isUnavailable:
      product.stockStatus === "out_of_stock" ||
      product.stockQuantity === 0 ||
      sizeStock?.status === "out_of_stock" ||
      sizeStock?.quantity === 0,
  };
}

function makeCartItem(resolved: ResolvedOffer, settings: FlashSaleSectionSettings, index: number): CartItem {
  const { offer, product } = resolved;
  return {
    id: product.legacyId || 0,
    name: product.name || settings.title || "Flash Sale",
    slug: product.slug || "",
    type: product.type || "Flash Sale",
    price: resolved.price,
    originalPrice: resolved.originalPrice,
    image: resolved.imageUrl,
    size: resolved.size,
    color: resolved.color,
    quantity: 1,
    priceOverride: true,
    lockedVariant: true,
    promotionLabel: settings.badge || settings.title || "Flash Sale",
    bundleKey: `flash-sale:${settings._updatedAt || settings.endsAt || "offer"}:${offer._key || product.legacyId || index}`,
  };
}

export function FlashSaleSection({ settings }: { settings: FlashSaleSectionSettings }) {
  const t = useTranslations("flashSaleSection");
  const toastT = useTranslations("commerceToast");
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();
  const { showToast } = useToast();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [remaining, setRemaining] = useState(() => getRemainingTime(settings.endsAt));

  useEffect(() => {
    if (!settings.endsAt) return;
    const timer = window.setInterval(() => setRemaining(getRemainingTime(settings.endsAt)), 1000);
    return () => window.clearInterval(timer);
  }, [settings.endsAt]);

  const offers = settings.offers.map(resolveOffer).filter((offer): offer is ResolvedOffer => Boolean(offer));
  const hasCountdown = Boolean(settings.endsAt);
  if (!settings.sectionEnabled || offers.length === 0 || (hasCountdown && remaining.total <= 0)) return null;

  const countdownBlocks = [
    { label: t("days"), value: remaining.days },
    { label: t("hours"), value: remaining.hours },
    { label: t("minutes"), value: remaining.minutes },
    { label: t("seconds"), value: remaining.seconds },
  ];

  const scrollToOffer = (index: number) => {
    const nextIndex = (index + offers.length) % offers.length;
    const card = carouselRef.current?.children.item(nextIndex) as HTMLElement | null;
    card?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    setActiveIndex(nextIndex);
  };

  const handleScroll = () => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const center = carousel.getBoundingClientRect().left + carousel.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    Array.from(carousel.children).forEach((child, index) => {
      const rect = child.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveIndex(closestIndex);
  };

  const trackAdd = (resolved: ResolvedOffer) => {
    trackMetaPixelEvent("AddToCart", {
      content_ids: [String(resolved.product.legacyId)],
      contents: [{ id: String(resolved.product.legacyId), quantity: 1, item_price: resolved.price }],
      content_name: resolved.product.name || settings.title,
      content_type: "product",
      value: resolved.price,
      currency: "EGP",
    });
  };

  const handleAdd = (resolved: ResolvedOffer, index: number) => {
    if (resolved.isUnavailable) return;
    if (!addToCart(makeCartItem(resolved, settings, index), { openCart: false })) return;
    trackAdd(resolved);
    const details = [resolved.size, resolved.color].filter(Boolean).join(" - ");
    showToast({
      title: toastT("addedToCart"),
      description: `${resolved.product.name || settings.title}${details ? ` - ${details}` : ""}`,
      action: { label: toastT("checkout"), onClick: () => router.push("/checkout") },
      cancel: { label: toastT("keepShopping"), onClick: () => {} },
    });
  };

  const handleBuy = (resolved: ResolvedOffer, index: number) => {
    if (resolved.isUnavailable) return;
    setBuyNowItem(makeCartItem(resolved, settings, index));
    trackAdd(resolved);
    router.push("/checkout");
  };

  return (
    <section className="relative overflow-hidden bg-[#0F1A26] py-12 text-white sm:py-16 lg:py-20">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#EEBC3F]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#EEBC3F]/35 bg-[#EEBC3F]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#EEBC3F]">
              <Zap className="h-4 w-4 fill-[#EEBC3F]" />
              {settings.eyebrow || t("eyebrow")}
            </div>
            <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">{settings.title || t("title")}</h2>
            {settings.description && <p className="mt-3 max-w-xl text-sm leading-7 text-white/60 sm:text-base">{settings.description}</p>}
          </div>

          {hasCountdown && (
            <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/55">
                <Clock3 className="h-4 w-4 text-[#EEBC3F]" />
                {settings.discountLabel || t("endsIn")}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {countdownBlocks.map((block) => (
                  <div key={block.label} className="rounded-xl bg-[#09121B] px-1 py-2.5 text-center">
                    <span className="block font-mono text-lg font-black text-[#EEBC3F] sm:text-xl">{String(block.value).padStart(2, "0")}</span>
                    <span className="mt-1 block text-[8px] font-bold uppercase text-white/40 sm:text-[9px]">{block.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex items-center justify-between sm:mt-10">
          <div className="flex items-center gap-2 text-xs font-bold text-white/50">
            <Sparkles className="h-4 w-4 text-[#EEBC3F]" />
            <span>{activeIndex + 1} / {offers.length}</span>
          </div>
          {offers.length > 1 && (
            <div className="hidden items-center gap-2 sm:flex">
              <Button type="button" size="icon" variant="outline" aria-label={t("previous")} onClick={() => scrollToOffer(activeIndex - 1)} className="h-10 w-10 rounded-full border-white/15 bg-white/[0.06] text-white hover:bg-white hover:text-[#0F1A26]"><ChevronLeft className="h-5 w-5" /></Button>
              <Button type="button" size="icon" variant="outline" aria-label={t("next")} onClick={() => scrollToOffer(activeIndex + 1)} className="h-10 w-10 rounded-full border-white/15 bg-white/[0.06] text-white hover:bg-white hover:text-[#0F1A26]"><ChevronRight className="h-5 w-5" /></Button>
            </div>
          )}
        </div>

        <div ref={carouselRef} onScroll={handleScroll} className="no-scrollbar -mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          {offers.map((resolved, index) => (
            <article key={resolved.offer._key || `${resolved.product.legacyId}-${resolved.size}-${resolved.color}-${index}`} className="w-[82vw] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-2xl border border-white/10 bg-white text-[#0F1A26] sm:w-[320px]">
              <div className="relative aspect-[4/3] bg-[#F4EFE7]">
                <Image src={resolved.imageUrl} alt={resolved.product.name || settings.title} fill sizes="(max-width: 640px) 82vw, 320px" className="object-contain p-4 transition-transform duration-500 hover:scale-105" quality={70} />
                {resolved.discountPercent > 0 && <span className="absolute start-3 top-3 rounded-full bg-[#EEBC3F] px-3 py-1.5 text-xs font-black shadow-lg">-{resolved.discountPercent}%</span>}
                {settings.badge && <span className="absolute end-3 top-3 rounded-full bg-[#0F1A26] px-3 py-1.5 text-xs font-bold text-white">{settings.badge}</span>}
              </div>
              <div className="p-4 sm:p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#A97900]">{resolved.product.type}</p>
                <h3 className="mt-1 line-clamp-1 text-xl font-black">{resolved.product.name || settings.title}</h3>
                <div className="mt-3 flex min-h-8 flex-wrap gap-2">
                  {resolved.size && <span className="rounded-full bg-[#F4EFE7] px-3 py-1.5 text-xs font-bold">{t("size")}: {resolved.size}</span>}
                  {resolved.color && resolved.offer.selectedColor && <span className="max-w-full truncate rounded-full bg-[#F4EFE7] px-3 py-1.5 text-xs font-bold">{t("color")}: {resolved.color}</span>}
                </div>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl font-black">EGP {resolved.price}</span>
                  {resolved.originalPrice > resolved.price && <span className="text-sm font-bold text-[#0F1A26]/35 line-through">EGP {resolved.originalPrice}</span>}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Button type="button" onClick={() => handleAdd(resolved, index)} disabled={resolved.isUnavailable} variant="outline" className="h-11 rounded-xl px-2 font-bold">
                    <ShoppingBag className="h-4 w-4 shrink-0" /><span className="truncate">{resolved.isUnavailable ? t("unavailable") : settings.addToCartLabel || t("add")}</span>
                  </Button>
                  <Button type="button" onClick={() => handleBuy(resolved, index)} disabled={resolved.isUnavailable} className="h-11 rounded-xl bg-[#EEBC3F] px-2 font-black text-[#0F1A26] hover:bg-[#d4a535]">
                    <span className="truncate">{resolved.isUnavailable ? t("unavailable") : settings.buyNowLabel || t("buy")}</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
