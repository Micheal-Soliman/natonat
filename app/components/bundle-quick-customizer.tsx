"use client";

import { useMemo, useState } from "react";
import type React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { useCart } from "@/app/lib/cart-context";
import { useToast } from "@/app/components/toast-provider";
import { useSizeGuideSizes } from "@/app/lib/site-settings-context";
import { calculateBundlePrice, getPricingRuleKey } from "@/lib/bundle-pricing";
import type { Product } from "@/lib/products";
import { isProductOutOfStock } from "@/lib/product-stock";

type BundleQuickCustomizerProps = {
  product: Product;
  products: Product[];
  variant?: "light" | "dark";
  stopInteraction?: (event: React.MouseEvent | React.TouchEvent) => void;
};

type BundleQuickSelection = {
  productId?: number;
  size?: string;
  color?: string;
};

type SizeOption = ReturnType<typeof useSizeGuideSizes>[number];

const getSizeOptions = (product: Product | undefined, sizes: SizeOption[]) => {
  if (!product?.sizePrices) return [];
  return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
};

const getDefaultSize = (product: Product | undefined, sizes: SizeOption[]) => {
  const sizeOptions = getSizeOptions(product, sizes).map((size) => size.id);
  if (sizeOptions.includes("m")) return "m";
  return sizeOptions[0] || product?.size?.toLowerCase();
};

export function BundleQuickCustomizer({
  product,
  products,
  variant = "light",
  stopInteraction,
}: BundleQuickCustomizerProps) {
  const t = useTranslations("shop.quickAdd");
  const toastT = useTranslations("commerceToast");
  const bundleT = useTranslations("bundleCustomizer");
  const router = useRouter();
  const { addToCart, setBuyNowItem } = useCart();
  const { showToast } = useToast();
  const sizes = useSizeGuideSizes();
  const isDark = variant === "dark";

  const initialSelections = useMemo(() => {
    const initial: Record<number, BundleQuickSelection> = {};

    product.bundleItems?.forEach((item, index) => {
      const selectedProductId = item.productId || item.productIds?.[0];
      const selectedProduct = products.find((candidate) => candidate.id === selectedProductId);
      initial[index] = {
        productId: selectedProductId,
        size: getDefaultSize(selectedProduct, sizes),
        color: selectedProduct?.colors?.[0]?.id,
      };
    });

    return initial;
  }, [product.bundleItems, products, sizes]);

  const [selections, setSelections] = useState<Record<number, BundleQuickSelection>>(initialSelections);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateSelection = (index: number, selection: BundleQuickSelection) => {
    setSelections((current) => ({
      ...current,
      [index]: {
        ...current[index],
        ...selection,
      },
    }));
  };

  const resolvedSelections = useMemo(() => {
    return (product.bundleItems || []).map((item, index) => {
      const selection = selections[index] || {};
      const selectedProductId = selection.productId || item.productId || item.productIds?.[0] || 0;
      const selectedProduct = products.find((candidate) => candidate.id === selectedProductId);
      const size = selection.size || getDefaultSize(selectedProduct, sizes);
      const colorId = selection.color || selectedProduct?.colors?.[0]?.id;
      const color = selectedProduct?.colors?.find((candidate) => candidate.id === colorId);
      const sizePrice =
        size && selectedProduct?.sizePrices
          ? selectedProduct.sizePrices[size as keyof typeof selectedProduct.sizePrices]
          : undefined;

      return {
        productId: selectedProductId,
        productName: selectedProduct?.name || "",
        productSlug: selectedProduct?.slug,
        productType: selectedProduct?.type,
        label: item.label,
        size,
        color: color?.name || selectedProduct?.color,
        quantity: item.quantity,
        price: sizePrice?.price ?? selectedProduct?.price,
        originalPrice: sizePrice?.originalPrice ?? selectedProduct?.originalPrice,
        image: color?.image || selectedProduct?.image,
      };
    });
  }, [product.bundleItems, products, selections, sizes]);

  const bundlePrice = useMemo(() => {
    const pricingRuleKey = getPricingRuleKey(product);

    if (product.dynamicPricing && product.bundleItems && pricingRuleKey) {
      return calculateBundlePrice(
        product.bundleItems,
        resolvedSelections.map((selection) => ({
          productId: selection.productId,
          size: selection.size,
          quantity: selection.quantity,
        })),
        products,
        pricingRuleKey
      );
    }

    return { price: product.price, originalPrice: product.originalPrice };
  }, [product, products, resolvedSelections]);

  const cartItem = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    type: product.type,
    price: bundlePrice.price,
    originalPrice: bundlePrice.originalPrice,
    image: product.image,
    quantity: 1,
    isBundle: true,
    bundleSelections: resolvedSelections.map((selection) => ({
      productId: selection.productId,
      productName: selection.productName,
      productSlug: selection.productSlug,
      productType: selection.productType,
      label: selection.label,
      size: selection.size,
      color: selection.color,
      quantity: selection.quantity,
      price: selection.price,
      originalPrice: selection.originalPrice,
    })),
  };

  if (!product.bundleItems?.length) return null;

  const bundleItems = product.bundleItems;
  const activeItem = bundleItems[activeIndex] || bundleItems[0];
  const activeSelection = selections[activeIndex] || {};
  const activeSelectedProductId =
    activeSelection.productId || activeItem.productId || activeItem.productIds?.[0];
  const activeSelectedProduct = products.find((candidate) => candidate.id === activeSelectedProductId);
  const activeProductOptions = activeItem.productIds
    ? activeItem.productIds.map((id) => products.find((candidate) => candidate.id === id)).filter(Boolean) as Product[]
    : activeSelectedProduct
      ? [activeSelectedProduct]
      : [];
  const activeSizeOptions = getSizeOptions(activeSelectedProduct, sizes);
  const activeSelectedColor = activeSelectedProduct?.colors?.find(
    (color) => color.id === activeSelection.color
  );
  const activePreviewImage = activeSelectedColor?.image || activeSelectedProduct?.image;
  const hasPrevious = activeIndex > 0;
  const hasNext = activeIndex < bundleItems.length - 1;
  const nextItemLabel = hasNext ? bundleItems[activeIndex + 1]?.label : "";
  const nextButtonLabel = nextItemLabel ? `${t("next")}: ${nextItemLabel}` : t("next");
  const hasUnavailableSelection =
    isProductOutOfStock(product) ||
    resolvedSelections.some((selection) => {
      const selectedProduct = products.find((candidate) => candidate.id === selection.productId);
      return selectedProduct ? isProductOutOfStock(selectedProduct) : false;
    });
  const unavailableLabel = bundleT("unavailable");

  const handleAdd = () => {
    if (hasUnavailableSelection) return;
    addToCart(cartItem, { openCart: false });
    showToast({
      title: toastT("bundleAddedToCart"),
      description: product.name,
      action: {
        label: toastT("checkout"),
        onClick: () => router.push("/checkout"),
      },
      cancel: {
        label: toastT("keepShopping"),
        onClick: () => {},
      },
    });
  };

  const handleBuy = () => {
    if (hasUnavailableSelection) return;
    setBuyNowItem(cartItem);
    router.push("/checkout");
  };

  return (
    <div
      className={`mt-2 rounded-2xl p-2 shadow-sm backdrop-blur-sm sm:p-3 ${
        isDark
          ? "border border-white/10 bg-white/[0.07] shadow-black/10"
          : "border border-[#0F1A26]/8 bg-white/85"
      }`}
      onMouseDown={stopInteraction}
      onTouchStart={stopInteraction}
    >
      <div>
        <div className="mb-2 flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {resolvedSelections.map((selection, index) => (
            <button
              key={`${product.id}-summary-${index}`}
              type="button"
              aria-pressed={activeIndex === index}
              onClick={() => setActiveIndex(index)}
              className={`relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border transition-all ${
                activeIndex === index
                  ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/35"
                  : isDark
                    ? "border-white/15 bg-white/10"
                    : "border-[#0F1A26]/10 bg-white"
              }`}
              title={selection.label || selection.productName}
            >
              {selection.image && (
                <Image
                  src={selection.image}
                  alt={selection.productName || product.name}
                  fill
                  sizes="40px"
                  className="object-contain"
                  loading="lazy"
                  quality={35}
                />
              )}
              <span className="absolute bottom-0 right-0 rounded-tl-md bg-[#EEBC3F] px-1 text-[9px] font-bold text-[#0F1A26]">
                {index + 1}
              </span>
            </button>
          ))}
        </div>

        <div className={`rounded-xl p-2 ${isDark ? "bg-black/10" : "bg-[#F8F6F3]"}`}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? "text-white/45" : "text-[#0F1A26]/45"}`}>
                {t("step", { current: activeIndex + 1, total: bundleItems.length })}
              </p>
              {activeItem.label && (
                <h4 className={`truncate text-xs font-bold ${isDark ? "text-white" : "text-[#0F1A26]"}`}>
                  {activeItem.label}
                </h4>
              )}
            </div>
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-white">
              {activePreviewImage && (
                <Image
                  src={activePreviewImage}
                  alt={activeSelectedProduct?.name || product.name}
                  fill
                  sizes="48px"
                  className="object-contain"
                  loading="lazy"
                  quality={45}
                />
              )}
            </div>
          </div>
          {hasUnavailableSelection && (
            <div className="mb-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-bold text-red-700">
              {bundleT("oneItemUnavailable")}
            </div>
          )}

          {activeProductOptions.length > 1 ? (
            <select
              value={activeSelectedProductId || ""}
              onChange={(event) => {
                const nextProductId = Number(event.target.value);
                const nextProduct = products.find((candidate) => candidate.id === nextProductId);
                updateSelection(activeIndex, {
                  productId: nextProductId,
                  size: getDefaultSize(nextProduct, sizes),
                  color: nextProduct?.colors?.[0]?.id,
                });
              }}
              className={`h-8 w-full rounded-lg border px-2 text-xs font-bold outline-none transition-colors ${
                isDark
                  ? "border-white/10 bg-white/10 text-white focus:border-[#EEBC3F]"
                  : "border-[#0F1A26]/10 bg-white text-[#0F1A26] focus:border-[#EEBC3F]"
              }`}
            >
              {activeProductOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          ) : (
            <p className={`text-xs font-bold ${isDark ? "text-white" : "text-[#0F1A26]"}`}>
              {activeSelectedProduct?.name}
            </p>
          )}

          {activeSizeOptions.length > 1 && (
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {activeSizeOptions.map((size) => {
                const isSelected = activeSelection.size === size.id;
                return (
                  <button
                    key={size.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => updateSelection(activeIndex, { size: size.id })}
                    className={`h-7 rounded-lg border text-xs font-bold transition-all ${
                      isSelected
                        ? "border-[#EEBC3F] bg-[#EEBC3F] text-[#0F1A26]"
                        : isDark
                          ? "border-white/10 bg-white/10 text-white/70 hover:border-[#EEBC3F]/60"
                          : "border-[#0F1A26]/10 bg-white text-[#0F1A26]/65 hover:border-[#EEBC3F]/60"
                    }`}
                  >
                    {size.label}
                  </button>
                );
              })}
            </div>
          )}

          {!!activeSelectedProduct?.colors?.length && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {activeSelectedProduct.colors.map((color) => {
                const isSelected = activeSelection.color === color.id;
                return (
                  <button
                    key={color.id}
                    type="button"
                    aria-label={`${t("color")}: ${color.name}`}
                    aria-pressed={isSelected}
                    onClick={() => updateSelection(activeIndex, { color: color.id })}
                    className={`relative h-7 w-7 overflow-hidden rounded-full border-2 transition-all ${
                      isSelected
                        ? "border-[#EEBC3F] ring-2 ring-[#EEBC3F]/35"
                        : isDark
                          ? "border-white/20 hover:border-[#EEBC3F]/70"
                          : "border-[#0F1A26]/10 hover:border-[#EEBC3F]/70"
                    }`}
                    title={color.name}
                  >
                    <Image
                      src={color.image}
                      alt={color.name}
                      fill
                      sizes="28px"
                      className="object-cover"
                      loading="lazy"
                      quality={40}
                    />
                  </button>
                );
              })}
            </div>
          )}

          {bundleItems.length > 1 && (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={!hasPrevious}
                onClick={() => setActiveIndex((current) => Math.max(0, current - 1))}
                className={`h-8 rounded-lg border text-xs font-bold transition-all disabled:opacity-40 ${
                  isDark
                    ? "border-white/10 bg-white/10 text-white hover:bg-white/15"
                    : "border-[#0F1A26]/10 bg-white text-[#0F1A26] hover:border-[#EEBC3F]/60"
                }`}
              >
                {t("back")}
              </button>
              <button
                type="button"
                disabled={!hasNext}
                onClick={() => setActiveIndex((current) => Math.min(bundleItems.length - 1, current + 1))}
                className="h-8 rounded-lg bg-[#EEBC3F] text-xs font-bold text-[#0F1A26] transition-all hover:bg-[#d4a535] disabled:opacity-40"
              >
                <span className="block truncate px-1">{nextButtonLabel}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`mt-2 flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold ${isDark ? "bg-black/10 text-white" : "bg-[#0F1A26]/5 text-[#0F1A26]"}`}>
        <span>{t("total")}</span>
        <span>EGP {bundlePrice.price}</span>
      </div>

      <div className={`mt-2 rounded-xl p-2 ${isDark ? "bg-black/10 text-white/70" : "bg-white text-[#0F1A26]/65"}`}>
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider">
          {bundleT("review")}
        </p>
        <div className="space-y-1">
          {resolvedSelections.map((selection, index) => (
            <div key={`${product.id}-review-${index}`} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="min-w-0 truncate font-semibold">
                {index + 1}. {selection.productName || selection.label}
              </span>
              <span className="shrink-0 text-right">
                {[selection.size?.toUpperCase(), selection.color, `x${selection.quantity}`].filter(Boolean).join(" / ")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:gap-2">
        <Button
          type="button"
          aria-label={t("add")}
          onClick={handleAdd}
          disabled={hasUnavailableSelection}
          className={`h-10 rounded-xl px-2 text-xs font-bold ${
            isDark
              ? "border border-white/10 bg-white/10 text-white hover:bg-white hover:text-[#0F1A26]"
              : "border border-[#0F1A26]/10 bg-[#F8F6F3] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white"
          }`}
          variant="outline"
        >
          <span className="truncate">{hasUnavailableSelection ? unavailableLabel : t("add")}</span>
        </Button>
        <Button
          type="button"
          aria-label={t("buy")}
          onClick={handleBuy}
          disabled={hasUnavailableSelection}
          className="h-10 rounded-xl bg-[#EEBC3F] px-2 text-xs font-bold text-[#0F1A26] shadow-sm shadow-[#EEBC3F]/25 hover:bg-[#d4a535]"
        >
          <span className="truncate">{hasUnavailableSelection ? unavailableLabel : t("buy")}</span>
        </Button>
      </div>
    </div>
  );
}
