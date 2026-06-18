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
        <div className="flex items-center justify-between p-6 border-b border-[#0F1A26]/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#EEBC3F]/10 rounded-xl flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#EEBC3F]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F1A26]">{t("title")}</h2>
              <p className="text-sm text-[#0F1A26]/60">
                {t("cartItems", { count: totalItems })}
              </p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="w-10 h-10 rounded-full bg-[#0F1A26]/5 flex items-center justify-center text-[#0F1A26]/60 hover:bg-[#0F1A26]/10 hover:text-[#0F1A26] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
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
            <div className="space-y-4">
              {items.map((item) => {
                const product = products.find((candidate) => candidate.id === item.id);
                const sizeOptions = !item.isBundle ? getSizeOptions(product) : [];
                const colorOptions = !item.isBundle ? product?.colors || [] : [];
                const selectedColorId =
                  colorOptions.find((color) => color.name === item.color || color.id === item.color)?.id || "";

                return (
                <div
                  key={`${item.id}-${item.size}-${item.color}-${item.isBundle ? JSON.stringify(item.bundleSelections || []) : ""}`}
                  className="bg-[#F1EBE3] rounded-2xl p-4 flex gap-4"
                >
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-white relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[#EEBC3F] text-xs font-semibold tracking-wider uppercase">
                          {item.type}
                        </span>
                        <h3 className="text-[#0F1A26] font-medium text-sm truncate">
                          {item.name}
                        </h3>
                        {(item.size || item.color) && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {item.size && (
                              <span className="bg-[#EEBC3F]/20 px-2 py-0.5 rounded text-[#0F1A26] text-xs font-medium">
                                {t("size")} {item.size.toUpperCase()}
                              </span>
                            )}
                            {item.color && (
                              <span className="bg-[#EEBC3F]/20 px-2 py-0.5 rounded text-[#0F1A26] text-xs font-medium capitalize">
                                {t("color")} {item.color}
                              </span>
                            )}
                          </div>
                        )}

                        {item.isBundle && item.bundleSelections && item.bundleSelections.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[#0F1A26]/60 text-[10px] uppercase tracking-wider font-semibold">
                              {t("bundleIncludes")}
                            </p>
                            {item.bundleSelections.map((bundleItem, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs text-[#0F1A26]/70">
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
                                <span className="text-[#0F1A26]/50">×{bundleItem.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {!item.isBundle && (sizeOptions.length > 1 || colorOptions.length > 1) && (
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {sizeOptions.length > 1 && (
                              <label className="block">
                                <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-[#0F1A26]/45">
                                  {t("size")}
                                </span>
                                <select
                                  value={item.size || ""}
                                  onChange={(event) => updateItemSize(item, event.target.value)}
                                  className="h-9 w-full rounded-lg border border-[#0F1A26]/10 bg-white px-2 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
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
                                  className="h-9 w-full rounded-lg border border-[#0F1A26]/10 bg-white px-2 text-xs font-bold text-[#0F1A26] outline-none focus:border-[#EEBC3F]"
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
                            className="mt-3 inline-flex rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#0F1A26] transition hover:bg-[#EEBC3F]/20"
                          >
                            {t("editBundle")}
                          </Link>
                        )}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id, item.size, item.color, item.bundleKey)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0F1A26]/50 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1, item.size, item.color, item.bundleKey)}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-medium text-[#0F1A26] text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1, item.size, item.color, item.bundleKey)}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Price */}
                      <span className="font-bold text-[#0F1A26]">
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
          <div className="border-t border-[#0F1A26]/10 bg-[#F1EBE3] p-4 sm:p-5">
            <div className="mb-3 rounded-2xl bg-white p-3 border border-[#0F1A26]/10">
              <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#0F1A26] mb-1.5">
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
            <div className="space-y-2 mb-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#0F1A26]/60">{t("summary.subtotal")}</span>
                <span className="text-[#0F1A26] font-medium">EGP {originalSubtotal}</span>
              </div>
              
              {discount > 0 && (
                <div>
                  <div className="flex justify-between text-sm text-green-600 font-medium">
                    <span>{t("summary.discount")}</span>
                    <span>-EGP {discount}</span>
                  </div>
                  <div className="hidden flex-col gap-0.5 sm:flex">
                    {appliedDiscounts.map((desc, i) => (
                      <span key={i} className="text-[10px] text-green-600/70 italic text-right block">
                        • {desc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-[#0F1A26]/10 pt-2">
                <div className="flex justify-between">
                  <span className="text-[#0F1A26] font-semibold">
                    {t("summary.total")}
                  </span>
                  <span className="text-[#0F1A26] font-bold text-base sm:text-lg">
                    EGP {subtotal}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-[#0F1A26]/45 text-center">
                {t("summary.shippingAtCheckout")}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/checkout"
                onClick={() => {
                  setBuyNowItem(null); // Clear buyNowItem to show all cart items
                  closeCart();
                }}
              >
                <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-12 px-2 font-bold text-xs sm:text-sm transition-all duration-300">
                  <span className="truncate">{t("summary.proceedToCheckout")}</span>
                </Button>
              </Link>

              <Link href="/cart" onClick={closeCart}>
                <Button
                  variant="outline"
                  className="w-full border-[#0F1A26]/20 text-[#0F1A26] hover:bg-[#0F1A26] rounded-full h-12 px-2 font-bold text-xs sm:text-sm transition-all duration-300"
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
