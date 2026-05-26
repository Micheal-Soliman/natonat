"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product } from "@/lib/products";

export interface WishlistItem {
  id: number;
  slug: string;
  name: string;
  type: string;
  price: number;
  originalPrice: number;
  image: string;
}

interface WishlistContextType {
  items: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  clearWishlist: () => void;
  totalItems: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const saved = localStorage.getItem("natonat-wishlist");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          // Filter out old items without slug
          const validItems = parsed.filter((item: WishlistItem) => item.slug);
          setItems(validItems);
        } catch {
          setItems([]);
        }
      }

      setIsHydrated(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, []);

  // Save to localStorage when items change
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("natonat-wishlist", JSON.stringify(items));
    }
  }, [items, isHydrated]);

  const addToWishlist = useCallback((product: Product) => {
    setItems((prev) => {
      if (prev.some((item) => item.id === product.id)) {
        return prev;
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          type: product.type,
          price: product.price,
          originalPrice: product.originalPrice,
          image: product.image,
        },
      ];
    });
  }, []);

  const removeFromWishlist = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const isInWishlist = useCallback(
    (id: number) => items.some((item) => item.id === id),
    [items]
  );

  const clearWishlist = useCallback(() => {
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        items,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        clearWishlist,
        totalItems: items.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
