"use client";

import { useCart } from "@/app/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

export function CartSlider() {
  const t = useTranslations("cart");
  const {
    items,
    removeFromCart,
    updateQuantity,
    subtotal,
    isOpen,
    closeCart,
    totalItems,
    setBuyNowItem,
  } = useCart();

  const shipping = subtotal > 1000 ? 0 : 75;
  const total = subtotal + shipping;

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
        <div className="flex-1 overflow-y-auto p-6">
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
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.size}-${item.color}`}
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
                      </div>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-[#0F1A26]/50 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantity */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-[#0F1A26] hover:bg-[#0F1A26]/10 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-medium text-[#0F1A26] text-sm">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
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
              ))}
            </div>
          )}
        </div>

        {/* Footer with Summary */}
        {items.length > 0 && (
          <div className="border-t border-[#0F1A26]/10 p-6 bg-[#F1EBE3]">
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#0F1A26]/60">{t("summary.subtotal")}</span>
                <span className="text-[#0F1A26] font-medium">EGP {subtotal}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#0F1A26]/60">{t("summary.shipping")}</span>
                <span className="text-[#0F1A26] font-medium">
                  {shipping === 0 ? t("summary.free") : `EGP ${shipping}`}
                </span>
              </div>
              <div className="border-t border-[#0F1A26]/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-[#0F1A26] font-semibold">
                    {t("summary.total")}
                  </span>
                  <span className="text-[#0F1A26] font-bold text-lg">
                    EGP {total}
                  </span>
                </div>
              </div>
            </div>

            <Link 
              href="/checkout" 
              onClick={() => {
                setBuyNowItem(null); // Clear buyNowItem to show all cart items
                closeCart();
              }}
            >
              <Button className="w-full bg-[#EEBC3F] text-[#0F1A26] hover:bg-[#0F1A26] hover:text-white rounded-full h-14 font-bold text-base transition-all duration-300 mb-3">
                {t("summary.proceedToCheckout")}
              </Button>
            </Link>

            <Link href="/cart" onClick={closeCart}>
              <Button
                variant="outline"
                className="w-full border-[#0F1A26]/20 text-[#0F1A26] hover:bg-[#0F1A26] rounded-full h-12 font-medium transition-all duration-300"
              >
                View Cart
              </Button>
            </Link>

            <p className="text-xs text-[#0F1A26]/40 text-center mt-3">
              {t("summary.note")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
