"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Clock3, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

import { useCart } from "@/app/lib/cart-context";
import { useToast } from "@/app/components/toast-provider";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/routing";
import type { FlashSaleSectionSettings } from "@/lib/sanity-site-settings";
import { trackMetaPixelEvent } from "@/lib/meta-pixel";

type FlashSaleSizeKey = "s" | "m" | "l" | "xl";

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

function formatNumber(value: number) {
  return String(value).padStart(2, "0");
}

export function FlashSaleSection({ settings }: { settings: FlashSaleSectionSettings }) {
  const t = useTranslations("flashSaleSection");
  const toastT = useTranslations("commerceToast");
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();
  const { showToast } = useToast();
  const [remaining, setRemaining] = useState(() => getRemainingTime(settings.endsAt));

  useEffect(() => {
    if (!settings.endsAt) return;

    const timer = window.setInterval(() => {
      setRemaining(getRemainingTime(settings.endsAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [settings.endsAt]);

  const product = settings.product;
  const sizeKey = settings.selectedSize?.toLowerCase() as FlashSaleSizeKey | undefined;
  const sizePrice = sizeKey ? product?.sizePrices?.[sizeKey] : undefined;
  const colorVariant = product?.colors?.find((color) => color.id === settings.selectedColor);
  const selectedColorName = colorVariant?.name || settings.selectedColor || product?.color;
  const basePrice = sizePrice?.price ?? product?.price ?? 0;
  const baseOriginalPrice = sizePrice?.originalPrice ?? product?.originalPrice ?? basePrice;
  const salePrice = basePrice;
  const imageUrl = settings.imageUrl || colorVariant?.imageUrl || product?.imageUrl || "/logo-after.png";
  const sizeStock = sizeKey ? product?.sizeStock?.[sizeKey] : undefined;
  const isUnavailable =
    product?.stockStatus === "out_of_stock" ||
    product?.stockQuantity === 0 ||
    sizeStock?.status === "out_of_stock" ||
    sizeStock?.quantity === 0;
  const hasFixedVariant = Boolean(settings.selectedSize || settings.selectedColor);
  const hasCountdown = Boolean(settings.endsAt);
  const isExpired = hasCountdown && remaining.total <= 0;

  const cartItem = useMemo(
    () => ({
      id: product?.legacyId || 0,
      name: product?.name || settings.title,
      slug: product?.slug || "",
      type: product?.type || "Flash Sale",
      price: salePrice,
      originalPrice: Math.max(baseOriginalPrice, basePrice),
      image: imageUrl,
      size: settings.selectedSize,
      color: selectedColorName,
      quantity: 1,
      priceOverride: true,
      lockedVariant: true,
      promotionLabel: settings.badge || settings.title || "Flash Sale",
      bundleKey: `flash-sale:${settings._updatedAt || settings.endsAt || product?.legacyId || "offer"}`,
    }),
    [
      baseOriginalPrice,
      basePrice,
      imageUrl,
      product?.legacyId,
      product?.name,
      product?.slug,
      product?.type,
      salePrice,
      selectedColorName,
      settings._updatedAt,
      settings.badge,
      settings.endsAt,
      settings.selectedSize,
      settings.title,
    ],
  );

  if (!settings.sectionEnabled || !product || !hasFixedVariant || isExpired) return null;

  const trackAdd = () => {
    trackMetaPixelEvent("AddToCart", {
      content_ids: [String(product.legacyId)],
      contents: [{ id: String(product.legacyId), quantity: 1, item_price: salePrice }],
      content_name: product.name,
      content_type: "product",
      value: salePrice,
      currency: "EGP",
    });
  };

  const handleAdd = () => {
    if (isUnavailable) return;
    addToCart(cartItem, { openCart: false });
    trackAdd();
    showToast({
      title: toastT("addedToCart"),
      description: `${product.name}${settings.selectedSize ? ` · ${settings.selectedSize.toUpperCase()}` : ""}${selectedColorName ? ` · ${selectedColorName}` : ""}`,
      action: { label: toastT("checkout"), onClick: () => router.push("/checkout") },
      cancel: { label: toastT("keepShopping"), onClick: () => {} },
    });
  };

  const handleBuy = () => {
    if (isUnavailable) return;
    setBuyNowItem(cartItem);
    trackAdd();
    router.push("/checkout");
  };

  const discountPercent = baseOriginalPrice > salePrice
    ? Math.round((1 - salePrice / baseOriginalPrice) * 100)
    : 0;
  const countdownBlocks = [
    { label: t("days"), value: remaining.days },
    { label: t("hours"), value: remaining.hours },
    { label: t("minutes"), value: remaining.minutes },
    { label: t("seconds"), value: remaining.seconds },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0F1A26] py-12 text-white sm:py-16 lg:py-20">
      <div className="absolute inset-x-0 top-0 h-1 bg-[#EEBC3F]" />
      <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14 lg:px-8">
        <div className="relative min-h-[300px] sm:min-h-[420px]">
          <Image
            src={imageUrl}
            alt={product.name || settings.title}
            fill
            sizes="(max-width: 1024px) 92vw, 45vw"
            className="object-contain drop-shadow-[0_28px_35px_rgba(0,0,0,0.3)]"
            quality={70}
          />
          {discountPercent > 0 && (
            <span className="absolute left-2 top-2 rounded-full bg-[#EEBC3F] px-4 py-2 text-sm font-black text-[#0F1A26] shadow-xl sm:left-6 sm:top-6">
              -{discountPercent}%
            </span>
          )}
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#EEBC3F]/35 bg-[#EEBC3F]/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#EEBC3F]">
            <Zap className="h-4 w-4 fill-[#EEBC3F]" />
            {settings.eyebrow || t("eyebrow")}
          </div>
          <h2 className="mt-5 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
            {settings.title || t("title")}
          </h2>
          {settings.description && (
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
              {settings.description}
            </p>
          )}

          <div className="mt-6 border-y border-white/10 py-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#EEBC3F]">
              {product.type}
            </p>
            <h3 className="mt-1 text-2xl font-black">{product.name}</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {settings.selectedSize && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0F1A26]">
                  {t("size")}: {settings.selectedSize.toUpperCase()}
                </span>
              )}
              {selectedColorName && settings.selectedColor && (
                <span className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#0F1A26]">
                  {t("color")}: {selectedColorName}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EEBC3F] px-4 py-2 text-sm font-black text-[#0F1A26]">
                <Sparkles className="h-4 w-4" />
                {t("fixedVariant")}
              </span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-4xl font-black text-[#EEBC3F]">EGP {salePrice}</span>
            {baseOriginalPrice > salePrice && (
              <span className="text-lg font-bold text-white/35 line-through">EGP {baseOriginalPrice}</span>
            )}
          </div>

          {hasCountdown && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-white/50">
                <Clock3 className="h-4 w-4 text-[#EEBC3F]" />
                {settings.discountLabel || t("endsIn")}
              </div>
              <div className="grid max-w-lg grid-cols-4 gap-2">
                {countdownBlocks.map((block) => (
                  <div key={block.label} className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-3 text-center">
                    <span className="block font-mono text-xl font-black text-[#EEBC3F] sm:text-2xl">
                      {formatNumber(block.value)}
                    </span>
                    <span className="mt-1 block text-[9px] font-bold uppercase text-white/40 sm:text-[10px]">
                      {block.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-7 grid max-w-lg grid-cols-2 gap-3">
            <Button
              type="button"
              onClick={handleAdd}
              disabled={isUnavailable}
              variant="outline"
              className="h-12 rounded-xl border-white/15 bg-white/10 px-3 font-bold text-white hover:bg-white hover:text-[#0F1A26]"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="truncate">{isUnavailable ? t("unavailable") : settings.addToCartLabel || t("add")}</span>
            </Button>
            <Button
              type="button"
              onClick={handleBuy}
              disabled={isUnavailable}
              className="h-12 rounded-xl bg-[#EEBC3F] px-3 font-black text-[#0F1A26] hover:bg-[#d4a535]"
            >
              <span className="truncate">{isUnavailable ? t("unavailable") : settings.buyNowLabel || t("buy")}</span>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
