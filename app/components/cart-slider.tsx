"use client";

import { useCart } from "@/app/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCatalogProducts } from "@/app/lib/catalog-context";
import { useSizeGuideSizes } from "@/app/lib/site-settings-context";
import type { Product } from "@/lib/products";

export function CartSlider() {
  const t = useTranslations("cart");
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
    isOpen,
    closeCart,
    totalItems,
    setBuyNowItem,
  } = useCart();

  // Cart shows subtotal only - shipping calculated at checkout based on city selection
  const freeShippingThreshold = 1000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const getSizeOptions = (product?: Product) => {
    if (!product?.sizePrices) return [];
    return sizes.filter((size) => product.sizePrices?.[size.id as keyof NonNullable<Product["sizePrices"]>]);
  };

  const updateItemSize = (item: typeof items[number], nextSize: string) => {
    const product = products.find((candidate) => candidate.id === item.id);
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

  const updateItemColor = (item: typeof items[number], nextColorId: string) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={closeCart}
      />

      {/* Slider */}
      <div className="absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#0F1A26]/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEBC3F]/10">
              <ShoppingBag className="h-4 w-4 text-[#EEBC3F]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F1A26] sm:text-lg">{t("title")}</h2>
              <p className="text-xs text-[#0F1A26]/60 sm:text-sm">
                {t("cartItems", { count: totalItems })}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0F1A26]/5 text-[#0F1A26]/60 transition-colors hover:bg-[#0F1A26]/10 hover:text-[#0F1A26]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-5 sm:py-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 rounded-full bg-[#0F1A26]/5 flex items-center justify-center mx-auto mb-6">
                <ShoppingBag className="w-8 h-8 text-[#0F1A26]/30" />
              </div>
              <h3 className="text-lg font-semibold text-[#0F1A26] mb-2">
                {t("empty.title")}
              </h3>
              <p className="text-[#0F1A26]/50 mb-6">{t("empty.subtitle")}</p>
              <Button
                onClick={closeCart}
                className="bg-[#0F1A26] text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26] rounded-full px-8 h-12 font-semibold transition-all duration-300"
              >
                {t("empty.continueShopping")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const product = products.find((candidate) => candidate.id === item.id);
                const sizeOptions = !item.isBundle ? getSizeOptions(product) : [];
                const colorOptions = !item.isBundle ? product?.colors || [] : [];
                const selectedColorId =
                  colorOptions.find((color) => color.name === item.color || color.id === item.color)?.id || "";

                return (
                <div
                  key={`${item.id}-${item.size}-${item.color}-${item.isBundle ? JSON.stringify(item.bundleSelections || []) : ""}`}
                  className="flex gap-3 rounded-2xl bg-[#F1EBE3] p-3"
                >
                  {/* Image */}
                  <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white sm:h-20 sm:w-20">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 64px, 80px"
                      className="object-contain p-1"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#EEBC3F] sm:text-xs">
                          {item.type}
                        </span>
                        <h3 className="truncate text-sm font-semibold text-[#0F1A26]">
                          {item.name}
                        </h3>
                        {(item.size || item.color) && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {item.size && (
                              <span className="rounded bg-[#EEBC3F]/20 px-2 py-0.5 text-[11px] font-medium text-[#0F1A26]">
                                {t("size")} {item.size.toUpperCase()}
                              </span>
                            )}
                            {item.color && (
                              <span className="rounded bg-[#EEBC3F]/20 px-2 py-0.5 text-[11px] font-medium capitalize text-[#0F1A26]">
                                {t("color")} {item.color}
                              </span>
                            )}
                          </div>
                        )}

                        {item.isBundle && item.bundleSelections && item.bundleSelections.length > 0 && (
                          <div className="mt-2 max-h-24 space-y-1 overflow-y-auto pr-1">
                            <p className="text-[#0F1A26]/60 text-[10px] uppercase tracking-wider font-semibold">
                              {t("bundleIncludes")}
                            </p>
                            {item.bundleSelections.map((bundleItem, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[11px] text-[#0F1A26]/70">
                                <span className="truncate">{bundleItem.productName}</span>
                                {bundleItem.size && (
                                  <span className="bg-[#0F1A26]/10 px-1.5 py-0.5 rounded text-[10px]">
                                    {bundleItem.size.toUpperCase()}
                                  </span>
                                )}
                                {bundleItem.color && (
                                  <span className="bg-[#0F1A26]/10 px-1.5 py-0.5 rounded text-[10px] capitalize">
                                    {bundleItem.color}
                                  </span>
                                )}
                                <span className="text-[#0F1A26]/50">x{bundleItem.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {!item.isBundle && (sizeOptions.length > 1 || colorOptions.length > 1) && (
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            {sizeOptions.length > 1 && (
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                  {t("size")}
                                </span>
                                <select
                                  value={item.size || ""}
                                  onChange={(event) => updateItemSize(item, event.target.value)}
                                  className="h-8 w-full rounded-lg border border-[#0F1A26]/10 bg-white px-2 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
                                >
                                  {sizeOptions.map((size) => (
                                    <option key={size.id} value={size.id}>
                                      {size.label} - {size.range}
                                    </option>
                                  ))}
                                </select>
                              </label>
                            )}

                            {colorOptions.length > 1 && (
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                  {t("color")}
                                </span>
                                <select
                                  value={selectedColorId}
                                  onChange={(event) => updateItemColor(item, event.target.value)}
                                  className="h-8 w-full rounded-lg border border-[#0F1A26]/10 bg-white px-2 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
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

                        {item.isBundle && (
                          <Link
                            href={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="mt-2 inline-flex rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#0F1A26] transition hover:bg-[#EEBC3F]/20"
                          >
                            {t("editBundle")}
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color, item.bundleKey)}
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#0F1A26]/50 transition-colors hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1, item.size, item.color, item.bundleKey)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F1A26] transition-colors hover:bg-[#0F1A26]/10"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-medium text-[#0F1A26] text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1, item.size, item.color, item.bundleKey)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F1A26] transition-colors hover:bg-[#0F1A26]/10"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-sm font-bold text-[#0F1A26] sm:text-base">
                        EGP {item.price * item.quantity}
                      </span>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="shrink-0 border-t border-[#0F1A26]/10 bg-[#F1EBE3] p-3 sm:p-4">
            <div className="mb-2 rounded-2xl border border-[#0F1A26]/10 bg-white p-2.5">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-[11px] font-semibold text-[#0F1A26] sm:text-xs">
                <span>
                  {remainingForFreeShipping > 0
                    ? t("summary.freeShippingProgress", { amount: remainingForFreeShipping })
                    : t("summary.freeShippingUnlocked")}
                </span>
                <span>{Math.round(freeShippingProgress)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#0F1A26]/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#EEBC3F] transition-all duration-300"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
            <div className="mb-3 space-y-1.5">
              <div className="flex justify-between text-xs sm:text-sm">
                <span className="text-[#0F1A26]/60">{t("summary.subtotal")}</span>
                <span className="text-[#0F1A26] font-medium">EGP {originalSubtotal}</span>
              </div>
              
              {discount > 0 && (
                <div>
                  <div className="flex justify-between text-xs font-medium text-green-600 sm:text-sm">
                    <span>{t("summary.discount")}</span>
                    <span>-EGP {discount}</span>
                  </div>
                  <div className="hidden flex-col gap-0.5 sm:flex">
                    {appliedDiscounts.map((desc, i) => (
                      <span key={i} className="text-[10px] text-green-600/70 italic text-right block">
                        - {desc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[#0F1A26]/10 pt-1.5">
                <div className="flex justify-between">
                  <span className="text-[#0F1A26] font-semibold">
                    {t("summary.total")}
                  </span>
                  <span className="text-base font-bold text-[#0F1A26] sm:text-lg">
                    EGP {subtotal}
                  </span>
                </div>
              </div>
              <p className="text-center text-[10px] text-[#0F1A26]/45 sm:text-[11px]">
                {t("summary.shippingAtCheckout")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/checkout"
                className="block"
                onClick={() => {
                  setBuyNowItem(null); // Clear buyNowItem to show all cart items
                  closeCart();
                }}
              >
                <Button className="h-11 w-full rounded-full bg-[#EEBC3F] px-2 text-xs font-bold text-[#0F1A26] transition-all duration-300 hover:bg-[#0F1A26] hover:text-white sm:h-12 sm:text-sm">
                  <span className="truncate">{t("summary.proceedToCheckout")}</span>
                </Button>
              </Link>

              <Link href="/cart" onClick={closeCart} className="block">
                <Button
                  variant="outline"
                  className="h-11 w-full rounded-full border-[#0F1A26]/20 px-2 text-xs font-bold text-[#0F1A26] transition-all duration-300 hover:bg-[#0F1A26] sm:h-12 sm:text-sm"
                >
                  <span className="truncate">{t("summary.proceedToCart")}</span>
                </Button>
              </Link>
            </div>

            {/* <p className="text-xs text-[#0F1A26]/40 text-center mt-3">
              {t("summary.note")}
            </p> */}
          </div>
        )}
      </div>
    </div>
  );
}
