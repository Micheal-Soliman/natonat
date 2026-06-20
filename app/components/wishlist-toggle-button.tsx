"use client";

import type React from "react";
import { Heart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/toast-provider";
import { useWishlist } from "@/app/lib/wishlist-context";
import type { Product } from "@/lib/products";

type WishlistToggleButtonProps = {
  product: Product;
  className?: string;
  variant?: "light" | "dark";
};

export function WishlistToggleButton({
  product,
  className = "",
  variant = "light",
}: WishlistToggleButtonProps) {
  const toastT = useTranslations("commerceToast");
  const labelT = useTranslations("wishlistButton");
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const active = isInWishlist(product.id);

  const stopCardInteraction = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const toggleWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopCardInteraction(event);

    if (active) {
      removeFromWishlist(product.id);
      showToast({
        title: toastT("removedFromWishlist"),
        description: product.name,
      });
      return;
    }

    addToWishlist(product);
    showToast({
      title: toastT("addedToWishlist"),
      description: product.name,
    });
  };

  return (
    <button
      type="button"
      aria-label={active ? labelT("remove") : labelT("add")}
      aria-pressed={active}
      onClick={toggleWishlist}
      onMouseDown={stopCardInteraction}
      onTouchStart={stopCardInteraction}
      className={`z-50 flex h-10 w-10 items-center justify-center rounded-full shadow-lg backdrop-blur transition-all duration-300 hover:scale-105 ${
        variant === "dark"
          ? "bg-[#0F1A26]/80 text-white hover:bg-[#EEBC3F] hover:text-[#0F1A26]"
          : "bg-white/95 text-[#0F1A26] hover:bg-[#EEBC3F]"
      } ${active ? "text-[#EEBC3F]" : ""} ${className}`}
    >
      <Heart className={`h-5 w-5 ${active ? "fill-current" : ""}`} strokeWidth={2} />
    </button>
  );
}
