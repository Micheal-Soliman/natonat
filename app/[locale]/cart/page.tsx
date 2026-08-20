"use client";

import { Suspense, useEffect, useState } from "react";
import Image from "next/image";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { ArrowLeft, Minus, Plus, ShieldCheck, ShoppingBag, Sparkles, Trash2, Truck } from "lucide-react";
import { Navigation } from "@/app/sections/navigation";
import { Footer } from "@/app/sections/footer";
import { Loading } from "@/app/components/loading";
import { Button } from "@/components/ui/button";
import { useCart, type CartItem } from "@/app/lib/cart-context";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSizeGuideSizes } from "@/app/lib/site-settings-context";
import type { Product } from "@/lib/products";
import { isProductSizeOutOfStock } from "@/lib/product-stock";
import { FREE_DELIVERY_THRESHOLD, FREE_FIRST_EXCHANGE_THRESHOLD } from "@/lib/cart-offers";

type SizeOption = ReturnType<typeof useSizeGuideSizes>[number];

function getSizeOptions(product: Product | undefined, sizes: SizeOption[]) {
  if (!product?.sizePrices) return [];
  return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
}

export default function CartPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CartContent />
    </Suspense>
  );
}

function CartContent() {
  const t = useTranslations("cart");
  const stockT = useTranslations("stock");
  const products = useCatalogProducts();
  const sizes = useSizeGuideSizes();
  const {
    items,
    removeFromCart,
    updateQuantity,
    updateCartItem,
    subtotal,
    discount,
    originalSubtotal,
    appliedDiscounts,
    totalItems,
    offerSubtotal,
    offerDiscountPercent,
    freeDelivery,
    nextOfferMilestone,
    setBuyNowItem,
  } = useCart();
  const [mounted, setMounted] = useState(false);

  const freeShippingProgress = Math.min(100, (offerSubtotal / FREE_DELIVERY_THRESHOLD) * 100);
  const offerProgress = Math.min(100, (offerSubtotal / FREE_FIRST_EXCHANGE_THRESHOLD) * 100);
  const offerMessage = nextOfferMilestone?.unlocksFreeDelivery
    ? t("summary.offerNextFreeDelivery", { amount: nextOfferMilestone.amountRemaining })
    : nextOfferMilestone?.unlocksFreeFirstExchange
      ? t("summary.offerNextFreeExchange", { amount: nextOfferMilestone.amountRemaining })
      : nextOfferMilestone
        ? t("summary.offerNextDiscount", {
            amount: nextOfferMilestone.amountRemaining,
            percent: nextOfferMilestone.discountPercent,
          })
        : t("summary.offerMaximumUnlocked");

  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      setMounted(true);
      setBuyNowItem(null);
    });

    return () => cancelAnimationFrame(frameId);
  }, [setBuyNowItem]);

  const updateItemSize = (item: CartItem, nextSize: string) => {
    const product = products.find((candidate) => candidate.id === item.id);
    if (product && isProductSizeOutOfStock(product, nextSize)) return;

    const sizePrice = product?.sizePrices?.[nextSize as keyof NonNullable<Product["sizePrices"]>];

    updateCartItem(
      item.id,
      { size: item.size, color: item.color, bundleKey: item.bundleKey },
      {
        size: nextSize,
        price: sizePrice?.price ?? item.price,
        originalPrice: sizePrice?.originalPrice ?? item.originalPrice,
      }
    );
  };

  const updateItemColor = (item: CartItem, nextColorId: string) => {
    const product = products.find((candidate) => candidate.id === item.id);
    const color = product?.colors?.find((candidate) => candidate.id === nextColorId);

    updateCartItem(
      item.id,
      { size: item.size, color: item.color, bundleKey: item.bundleKey },
      {
        color: color?.name || nextColorId,
        image: color?.image || item.image,
      }
    );
  };

  const labels = {
    editBundle: t("editBundle"),
    bundleIncludes: t("bundleIncludes"),
    secure: t("securePayment"),
    courier: t("aramexShipping"),
    saved: t("saved"),
  };

  if (!mounted) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#F1EBE3] pt-28">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="h-96 animate-pulse rounded-2xl bg-[#0F1A26]/5" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F1EBE3] pt-24 pb-28 lg:pb-0">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#EEBC3F]">
                {t("title")}
              </span>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#0F1A26] sm:text-4xl">
                {t("header.title")}
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[#0F1A26]/55 sm:text-base">
                {t("header.subtitle")}
              </p>
            </div>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#0F1A26] transition-colors hover:text-[#EEBC3F]"
            >
              <ArrowLeft className="h-4 w-4" />
              {t("continueShopping")}
            </Link>
          </div>

          {items.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-3xl bg-white p-8 text-center shadow-sm sm:p-12">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[#EEBC3F]/15">
                <ShoppingBag className="h-8 w-8 text-[#0F1A26]/45" />
              </div>
              <h2 className="mb-2 text-2xl font-bold text-[#0F1A26]">{t("empty.title")}</h2>
              <p className="mb-8 text-[#0F1A26]/55">{t("empty.subtitle")}</p>
              <Link href="/shop">
                <Button className="h-12 rounded-full bg-[#0F1A26] px-8 font-bold text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26]">
                  {t("empty.continueShopping")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-[#0F1A26]">
                    {t("cartItems", { count: totalItems })}
                  </h2>
                  {discount > 0 && (
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                      {labels.saved} EGP {discount}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {items.map((item) => {
                    const product = products.find((candidate) => candidate.id === item.id);
                    const sizeOptions = !item.isBundle ? getSizeOptions(product, sizes) : [];
                    const colorOptions = !item.isBundle ? product?.colors || [] : [];
                    const selectedColorId =
                      colorOptions.find((color) => color.name === item.color || color.id === item.color)?.id || "";

                    return (
                      <article
                        key={`${item.id}-${item.size}-${item.color}-${item.bundleKey || ""}`}
                        className="rounded-3xl border border-[#0F1A26]/8 bg-white p-4 shadow-sm sm:p-5"
                      >
                        <div className="grid gap-4 sm:grid-cols-[132px_1fr]">
                          <Link
                            href={`/product/${item.slug}`}
                            className="relative aspect-square overflow-hidden rounded-2xl bg-[#F8F6F3]"
                          >
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="132px"
                              className="object-contain transition-transform duration-300 hover:scale-105"
                            />
                          </Link>

                          <div className="min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#EEBC3F]">
                                  {item.type}
                                </span>
                                <Link href={`/product/${item.slug}`}>
                                  <h3 className="mt-1 text-lg font-bold text-[#0F1A26] transition-colors hover:text-[#EEBC3F]">
                                    {item.name}
                                  </h3>
                                </Link>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.id, item.size, item.color, item.bundleKey)}
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F1A26]/5 text-[#0F1A26]/50 transition-colors hover:bg-red-50 hover:text-red-500"
                                aria-label={t("item.remove")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            {item.isBundle && item.bundleSelections?.length ? (
                              <div className="mt-4 rounded-2xl bg-[#F8F6F3] p-3">
                                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[#0F1A26]/50">
                                  {labels.bundleIncludes}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {item.bundleSelections.map((bundleItem, index) => (
                                    <div key={`${bundleItem.productId}-${index}`} className="rounded-xl bg-white px-3 py-2">
                                      <p className="truncate text-sm font-bold text-[#0F1A26]">
                                        {bundleItem.label || bundleItem.productName}
                                      </p>
                                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold text-[#0F1A26]/65">
                                        {bundleItem.productName && <span>{bundleItem.productName}</span>}
                                        {bundleItem.size && <span>{t("size")} {bundleItem.size.toUpperCase()}</span>}
                                        {bundleItem.color && <span>{bundleItem.color}</span>}
                                        <span>x{bundleItem.quantity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                <Link
                                  href={`/product/${item.slug}`}
                                  className="mt-3 inline-flex rounded-full bg-white px-4 py-2 text-xs font-bold text-[#0F1A26] transition-colors hover:bg-[#EEBC3F]/20"
                                >
                                  {labels.editBundle}
                                </Link>
                              </div>
                            ) : item.lockedVariant ? (
                              <div className="mt-4 inline-flex rounded-full bg-[#EEBC3F]/20 px-3 py-1.5 text-xs font-bold text-[#8A6200]">
                                {item.promotionLabel || "Flash Sale"}
                              </div>
                            ) : (
                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                {sizeOptions.length > 1 && (
                                  <label className="block">
                                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                      {t("size")}
                                    </span>
                                    <select
                                      value={item.size || ""}
                                      onChange={(event) => updateItemSize(item, event.target.value)}
                                      className="h-11 w-full rounded-xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-sm font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
                                    >
                                      {sizeOptions.map((size) => {
                                        const isSizeUnavailable = product
                                          ? isProductSizeOutOfStock(product, size.id)
                                          : false;

                                        return (
                                          <option key={size.id} value={size.id} disabled={isSizeUnavailable}>
                                            {size.label} - {size.range}
                                            {isSizeUnavailable ? ` (${stockT("outOfStock")})` : ""}
                                          </option>
                                        );
                                      })}
                                    </select>
                                  </label>
                                )}

                                {colorOptions.length > 1 && (
                                  <label className="block">
                                    <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                      {t("color")}
                                    </span>
                                    <select
                                      value={selectedColorId}
                                      onChange={(event) => updateItemColor(item, event.target.value)}
                                      className="h-11 w-full rounded-xl border border-[#0F1A26]/10 bg-[#F8F6F3] px-3 text-sm font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
                                    >
                                      {colorOptions.map((color) => (
                                        <option key={color.id} value={color.id}>
                                          {color.name}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                )}
                              </div>
                            )}

                            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-[#0F1A26]/8 pt-4">
                              <div className="flex items-center gap-2 rounded-full bg-[#F8F6F3] p-1">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, -1, item.size, item.color, item.bundleKey)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1A26] transition-colors hover:bg-[#EEBC3F]/25"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-8 text-center text-sm font-bold text-[#0F1A26]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, 1, item.size, item.color, item.bundleKey)}
                                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#0F1A26] transition-colors hover:bg-[#EEBC3F]/25"
                                >
                                  <Plus className="h-4 w-4" />
                                </button>
                              </div>

                              <div className="text-end">
                                {item.originalPrice && item.originalPrice > item.price && (
                                  <p className="text-sm text-[#0F1A26]/35 line-through">
                                    EGP {item.originalPrice * item.quantity}
                                  </p>
                                )}
                                <p className="text-xl font-black text-[#0F1A26]">
                                  EGP {item.price * item.quantity}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-3xl border border-[#0F1A26]/8 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="mb-4 text-xl font-bold text-[#0F1A26]">{t("summary.title")}</h2>

                  <div className="mb-5 rounded-2xl bg-[#F8F6F3] p-4">
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-[#0F1A26]">
                      <span>
                        {freeDelivery
                          ? t("summary.freeShippingUnlocked")
                          : t("summary.freeShippingProgress", {
                              amount: Math.max(0, FREE_DELIVERY_THRESHOLD - offerSubtotal),
                            })}
                      </span>
                      <span>{Math.round(freeShippingProgress)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#0F1A26]/10">
                      <div
                        className="h-full rounded-full bg-[#EEBC3F] transition-all duration-300"
                        style={{ width: `${freeShippingProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mb-5 overflow-hidden rounded-2xl border border-[#EEBC3F]/35 bg-[#FFFDF8] p-4 shadow-sm">
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F1A26] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#EEBC3F]">
                          <Sparkles className="h-3 w-3" />
                          {t("summary.valueOffer")}
                        </span>
                        <p className="mt-2 text-sm font-bold leading-6 text-[#0F1A26]">{offerMessage}</p>
                      </div>
                      <div className="shrink-0 rounded-xl bg-[#EEBC3F]/20 px-3 py-2 text-center ring-1 ring-[#EEBC3F]/35">
                        <span className="block text-[10px] font-black uppercase text-[#0F1A26]/45">
                          {t("summary.discount")}
                        </span>
                        <span className="text-lg font-black text-[#0F1A26]">{offerDiscountPercent}%</span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#0F1A26]/10">
                      <div
                        className="h-full rounded-full bg-[#0F1A26] transition-all duration-500"
                        style={{ width: `${offerProgress}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t("summary.subtotal")}</span>
                      <span className="font-bold text-[#0F1A26]">EGP {originalSubtotal}</span>
                    </div>
                    {discount > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm font-bold text-green-600">
                          <span>{t("summary.discount")}</span>
                          <span>-EGP {discount}</span>
                        </div>
                        {appliedDiscounts.map((desc, index) => (
                          <p key={index} className="text-end text-[11px] text-green-600/70">
                            {desc}
                          </p>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-[#0F1A26]/60">{t("summary.shipping")}</span>
                      <span className="font-bold text-[#0F1A26]">{t("summary.shippingAtCheckout")}</span>
                    </div>
                    <div className="border-t border-[#0F1A26]/10 pt-4">
                      <div className="flex justify-between">
                        <span className="text-lg font-bold text-[#0F1A26]">{t("summary.total")}</span>
                        <span className="text-2xl font-black text-[#0F1A26]">EGP {subtotal}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 rounded-2xl bg-[#F8F6F3] px-3 py-2 text-xs font-bold text-[#0F1A26]/70">
                      <ShieldCheck className="h-4 w-4 text-[#EEBC3F]" />
                      {labels.secure}
                    </div>
                    <div className="flex items-center gap-2 rounded-2xl bg-[#F8F6F3] px-3 py-2 text-xs font-bold text-[#0F1A26]/70">
                      <Truck className="h-4 w-4 text-[#EEBC3F]" />
                      {labels.courier}
                    </div>
                  </div>

                  <Link href="/checkout" onClick={() => setBuyNowItem(null)}>
                    <Button className="mt-5 h-14 w-full rounded-full bg-[#EEBC3F] text-base font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white">
                      {t("summary.proceedToCheckout")}
                    </Button>
                  </Link>
                  <p className="mt-3 text-center text-xs text-[#0F1A26]/45">
                    {t("summary.note")}
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-[#0F1A26]/10 bg-white/97 px-3 pt-2 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] backdrop-blur-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                  {t("summary.total")}
                </p>
                <p className="text-lg font-black text-[#0F1A26]">EGP {subtotal}</p>
              </div>
              <p className="text-xs font-semibold text-[#0F1A26]/45">
                {t("cartItems", { count: totalItems })}
              </p>
            </div>
            <Link href="/checkout" onClick={() => setBuyNowItem(null)}>
              <Button className="h-11 w-full rounded-xl bg-[#EEBC3F] px-3 text-sm font-black text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white">
                {t("summary.proceedToCheckout")}
              </Button>
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
