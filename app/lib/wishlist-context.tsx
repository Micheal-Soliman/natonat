"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { Product } from "@/lib/products";
import { useCatalogProducts } from "@/app/lib/catalog-context";

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
  const products = useCatalogProducts();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const saved = localStorage.getItem("natonat-wishlist");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const savedItems = Array.isArray(parsed) ? parsed : [];
          // Filter out old items without slug
          const validItems = savedItems
            .filter((item: WishlistItem) => item.slug)
            .map((item: WishlistItem) => {
              const product = products.find((candidate) => candidate.id === item.id);
              if (!product) return item;

              return {
                ...item,
                slug: product.slug,
                name: product.name,
                type: product.type,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
              };
            });
          setItems(validItems);
        } catch {
          setItems([]);
        }
      }

      setIsHydrated(true);
    });

    return () => cancelAnimationFrame(frameId);
  }, [products]);

  // Save to localStorage when items change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem("natonat-wishlist", JSON.stringify(items));
      } catch {
        // Ignore storage quota/privacy errors; wishlist still works for the session.
      }
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
